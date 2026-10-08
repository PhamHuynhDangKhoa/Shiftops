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
        return outboxRepository.findById(eventId)
                .map(event -> {
                    if (event.getStatus() == OutboxStatus.PENDING ||
                            (event.getStatus() == OutboxStatus.FAILED && event.getRetryCount() < event.getMaxRetries())) {
                        event.setStatus(OutboxStatus.PROCESSING);
                        outboxRepository.save(event);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
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
                // Exponential backoff: 5s, 10s, 20s
                long delaySeconds = (long) (Math.pow(2, newRetryCount) * 5);
                event.setScheduledAt(clock.instant().plus(Duration.ofSeconds(delaySeconds)));
                event.setStatus(OutboxStatus.PENDING);
                log.info("Outbox event {} scheduled for retry #{} in {}s: {}", eventId, newRetryCount, delaySeconds, errorMessage);
            }
            outboxRepository.save(event);
        });
    }
}
