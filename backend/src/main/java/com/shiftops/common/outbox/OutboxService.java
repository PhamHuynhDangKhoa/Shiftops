package com.shiftops.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxService {

    private final OutboxRepository outboxRepository;
    private final OutboxProperties outboxProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent saveEvent(String eventType, String aggregateType, UUID aggregateId, Object payload) {
        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event payload: eventType={}, aggregateId={}", eventType, aggregateId, e);
            throw new RuntimeException("Could not serialize outbox payload", e);
        }

        Instant now = clock.instant();
        OutboxEvent event = OutboxEvent.builder()
                .eventType(eventType)
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .payload(jsonPayload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .maxRetries(outboxProperties.getMaxRetries())
                .scheduledAt(now)
                .build();

        OutboxEvent saved = outboxRepository.save(event);
        log.debug("Saved outbox event: id={}, type={}, aggregateId={}", saved.getId(), eventType, aggregateId);
        return saved;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<UUID> claimEvent(UUID eventId) {
        try {
            Instant now = clock.instant();
            UUID claimToken = UUID.randomUUID();
            Instant leaseExpiresAt = now.plusMillis(outboxProperties.getLeaseDurationMs());
            int updated = outboxRepository.claimEventAtomically(eventId, claimToken, leaseExpiresAt, now);
            if (updated > 0) {
                log.debug("Claimed outbox event {} with token {}", eventId, claimToken);
                return Optional.of(claimToken);
            }
            return Optional.empty();
        } catch (org.springframework.dao.OptimisticLockingFailureException | org.hibernate.StaleStateException ex) {
            log.debug("Optimistic lock conflict when claiming outbox event {}: {}", eventId, ex.getMessage());
            return Optional.empty();
        } catch (Exception ex) {
            log.warn("Error claiming outbox event {}: {}", eventId, ex.getMessage());
            return Optional.empty();
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markProcessed(UUID eventId, UUID claimToken) {
        Instant now = clock.instant();
        int updated = outboxRepository.markProcessedAtomically(eventId, claimToken, now);
        if (updated > 0) {
            log.debug("Outbox event marked PROCESSED: id={}, token={}", eventId, claimToken);
            return true;
        } else {
            log.warn("Worker lost claim ownership for event {} (token: {}); ignoring markProcessed", eventId, claimToken);
            return false;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markFailed(UUID eventId, UUID claimToken, String errorMessage) {
        Instant now = clock.instant();
        String truncatedError = errorMessage != null && errorMessage.length() > 490 ? errorMessage.substring(0, 490) : errorMessage;

        // Fetch current retry status to compute next backoff
        Optional<OutboxEvent> optEvent = outboxRepository.findById(eventId);
        if (optEvent.isEmpty()) {
            return false;
        }
        OutboxEvent event = optEvent.get();
        int newRetryCount = event.getRetryCount() + 1;

        int updated;
        if (newRetryCount >= event.getMaxRetries()) {
            updated = outboxRepository.markPermanentlyFailed(eventId, claimToken, truncatedError, now);
            if (updated > 0) {
                log.warn("Outbox event {} permanently FAILED after {} attempts: {}", eventId, newRetryCount, errorMessage);
            }
        } else {
            // Exponential backoff: baseBackoff * 2^(retry - 1)
            long delaySeconds = (long) (Math.pow(2, Math.max(0, newRetryCount - 1)) * outboxProperties.getBaseBackoffSeconds());
            Instant nextScheduled = now.plusSeconds(delaySeconds);
            updated = outboxRepository.markFailedAndRescheduled(eventId, claimToken, nextScheduled, truncatedError, now);
            if (updated > 0) {
                log.info("Outbox event {} scheduled for retry #{} in {}s: {}", eventId, newRetryCount, delaySeconds, errorMessage);
            }
        }

        if (updated == 0) {
            log.warn("Worker lost claim ownership for event {} (token: {}); ignoring markFailed", eventId, claimToken);
            return false;
        }
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recoverStaleEvents(Duration staleThresholdDuration) {
        Instant now = clock.instant();
        Instant staleThreshold = now.minus(staleThresholdDuration);
        List<OutboxEvent> staleEvents = outboxRepository.findStaleProcessingEvents(now, staleThreshold, PageRequest.of(0, 50));
        int recovered = 0;
        for (OutboxEvent event : staleEvents) {
            try {
                int newRetryCount = event.getRetryCount() + 1;
                int updated;
                if (newRetryCount >= event.getMaxRetries()) {
                    String err = "Stale PROCESSING lease recovery: exceeded max retries (" + event.getMaxRetries() + ")";
                    updated = outboxRepository.recoverStaleEventToFailed(
                            event.getId(), event.getClaimToken(), err, now, staleThreshold);
                    if (updated > 0) {
                        log.warn("Stale outbox event {} permanently FAILED after {} attempts", event.getId(), newRetryCount);
                    }
                } else {
                    long delaySeconds = (long) (Math.pow(2, Math.max(0, newRetryCount - 1)) * outboxProperties.getBaseBackoffSeconds());
                    Instant nextScheduled = now.plusSeconds(delaySeconds);
                    String err = "Stale PROCESSING lease recovery: rescheduled retry #" + newRetryCount;
                    updated = outboxRepository.recoverStaleEventToPending(
                            event.getId(), event.getClaimToken(), nextScheduled, err, now, staleThreshold);
                    if (updated > 0) {
                        log.info("Stale outbox event {} recovered to PENDING for retry #{}", event.getId(), newRetryCount);
                    }
                }
                if (updated > 0) {
                    recovered++;
                }
            } catch (org.springframework.dao.OptimisticLockingFailureException ex) {
                log.debug("Concurrent modification while recovering stale event {}: {}", event.getId(), ex.getMessage());
            } catch (Exception ex) {
                log.warn("Failed to recover stale outbox event {}: {}", event.getId(), ex.getMessage());
            }
        }
        return recovered;
    }
}
