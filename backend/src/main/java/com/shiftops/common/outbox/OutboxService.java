package com.shiftops.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxService {

    private final OutboxRepository outboxRepository;
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
                .maxRetries(3)
                .scheduledAt(now)
                .build();

        OutboxEvent saved = outboxRepository.save(event);
        log.debug("Saved outbox event: id={}, type={}, aggregateId={}", saved.getId(), eventType, aggregateId);
        return saved;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markProcessing(UUID eventId) {
        try {
            Instant now = clock.instant();
            int updated = outboxRepository.claimEventAtomically(eventId, now);
            return updated > 0;
        } catch (org.springframework.dao.OptimisticLockingFailureException | org.hibernate.StaleStateException ex) {
            log.debug("Optimistic lock conflict when claiming outbox event {}: {}", eventId, ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.warn("Error claiming outbox event {}: {}", eventId, ex.getMessage());
            return false;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recoverStaleEvents(Duration staleThresholdDuration) {
        Instant staleThreshold = clock.instant().minus(staleThresholdDuration);
        List<OutboxEvent> staleEvents = outboxRepository.findStaleProcessingEvents(
                staleThreshold, org.springframework.data.domain.PageRequest.of(0, 50));
        int recovered = 0;
        for (OutboxEvent event : staleEvents) {
            try {
                int newRetryCount = event.getRetryCount() + 1;
                event.setRetryCount(newRetryCount);
                if (newRetryCount >= event.getMaxRetries()) {
                    event.setStatus(OutboxStatus.FAILED);
                    event.setErrorMessage("Stale PROCESSING recovery: exceeded max retries (" + event.getMaxRetries() + ")");
                    log.warn("Stale outbox event {} permanently FAILED after {} attempts", event.getId(), newRetryCount);
                } else {
                    long delaySeconds = (long) (Math.pow(2, Math.max(0, newRetryCount - 1)) * 5);
                    event.setScheduledAt(clock.instant().plus(Duration.ofSeconds(delaySeconds)));
                    event.setStatus(OutboxStatus.PENDING);
                    event.setErrorMessage("Stale PROCESSING recovery: rescheduled retry #" + newRetryCount);
                    log.info("Stale outbox event {} recovered to PENDING for retry #{}", event.getId(), newRetryCount);
                }
                outboxRepository.saveAndFlush(event);
                recovered++;
            } catch (org.springframework.dao.OptimisticLockingFailureException ex) {
                log.debug("Concurrent modification while recovering stale event {}: {}", event.getId(), ex.getMessage());
            } catch (Exception ex) {
                log.warn("Failed to recover stale outbox event {}: {}", event.getId(), ex.getMessage());
            }
        }
        return recovered;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markProcessed(UUID eventId) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(OutboxStatus.PROCESSED);
            event.setProcessedAt(clock.instant());
            event.setErrorMessage(null);
            outboxRepository.save(event);
            log.debug("Outbox event marked PROCESSED: id={}", eventId);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID eventId, String errorMessage) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            int newRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(newRetryCount);
            event.setErrorMessage(errorMessage != null && errorMessage.length() > 490 ? errorMessage.substring(0, 490) : errorMessage);

            if (newRetryCount >= event.getMaxRetries()) {
                event.setStatus(OutboxStatus.FAILED);
                log.warn("Outbox event {} permanently FAILED after {} attempts: {}", eventId, newRetryCount, errorMessage);
            } else {
                // Exponential backoff: 5s, 10s, 20s (5 * 2^(retry-1))
                long delaySeconds = (long) (Math.pow(2, Math.max(0, newRetryCount - 1)) * 5);
                event.setScheduledAt(clock.instant().plus(Duration.ofSeconds(delaySeconds)));
                event.setStatus(OutboxStatus.PENDING);
                log.info("Outbox event {} scheduled for retry #{} in {}s: {}", eventId, newRetryCount, delaySeconds, errorMessage);
            }
            outboxRepository.save(event);
        });
    }
}
