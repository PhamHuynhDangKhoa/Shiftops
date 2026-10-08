package com.shiftops.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.notification.event.*;
import com.shiftops.notification.service.DurableNotificationHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxProcessor {

    private final OutboxRepository outboxRepository;
    private final OutboxService outboxService;
    private final DurableNotificationHandler durableNotificationHandler;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Value("${app.outbox.scheduler.enabled:true}")
    private boolean schedulerEnabled = true;

    @Value("${app.outbox.stale-threshold-seconds:300}")
    private long staleThresholdSeconds = 300;

    private static final int BATCH_SIZE = 25;

    public void setSchedulerEnabled(boolean schedulerEnabled) {
        this.schedulerEnabled = schedulerEnabled;
    }

    public void setStaleThresholdSeconds(long staleThresholdSeconds) {
        this.staleThresholdSeconds = staleThresholdSeconds;
    }

    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms:3000}")
    public void scheduleOutboxProcessing() {
        if (!schedulerEnabled) {
            return;
        }
        processPendingEvents();
    }

    public int processPendingEvents() {
        // 1. Recover stale processing events first
        try {
            outboxService.recoverStaleEvents(Duration.ofSeconds(staleThresholdSeconds));
        } catch (Exception ex) {
            log.warn("Error running stale outbox event recovery: {}", ex.getMessage());
        }

        // 2. Fetch eligible events
        Instant now = clock.instant();
        List<OutboxEvent> events = outboxRepository.findEligibleEvents(now, PageRequest.of(0, BATCH_SIZE));

        if (events.isEmpty()) {
            return 0;
        }

        int processedCount = 0;
        for (OutboxEvent event : events) {
            boolean claimed;
            try {
                claimed = outboxService.markProcessing(event.getId());
            } catch (OptimisticLockingFailureException ex) {
                log.debug("Event {} was claimed concurrently by another worker", event.getId());
                continue;
            } catch (Exception ex) {
                log.warn("Failed to claim event {}: {}", event.getId(), ex.getMessage());
                continue;
            }

            if (!claimed) {
                continue;
            }

            try {
                dispatchOutboxEvent(event);
                outboxService.markProcessed(event.getId());
                processedCount++;
            } catch (Exception ex) {
                log.error("Error processing outbox event: id={}, type={}", event.getId(), event.getEventType(), ex);
                outboxService.markFailed(event.getId(), ex.getMessage());
            }
        }

        if (processedCount > 0) {
            log.info("Processed {} outbox events", processedCount);
        }
        return processedCount;
    }

    private void dispatchOutboxEvent(OutboxEvent event) throws Exception {
        String type = event.getEventType();
        String json = event.getPayload();

        switch (type) {
            case "SHIFT_PUBLISHED" -> {
                ShiftPublishedEvent evt = objectMapper.readValue(json, ShiftPublishedEvent.class);
                durableNotificationHandler.handleShiftPublished(evt);
            }
            case "SHIFT_CHANGED" -> {
                ShiftChangedEvent evt = objectMapper.readValue(json, ShiftChangedEvent.class);
                durableNotificationHandler.handleShiftChanged(evt);
            }
            case "TASK_ASSIGNED" -> {
                TaskAssignedEvent evt = objectMapper.readValue(json, TaskAssignedEvent.class);
                durableNotificationHandler.handleTaskAssigned(evt);
            }
            case "ISSUE_ASSIGNED" -> {
                IssueAssignedEvent evt = objectMapper.readValue(json, IssueAssignedEvent.class);
                durableNotificationHandler.handleIssueAssigned(evt);
            }
            case "ISSUE_STATUS_CHANGED" -> {
                IssueStatusChangedEvent evt = objectMapper.readValue(json, IssueStatusChangedEvent.class);
                durableNotificationHandler.handleIssueStatusChanged(evt);
            }
            case "HANDOVER_SUBMITTED" -> {
                HandoverSubmittedEvent evt = objectMapper.readValue(json, HandoverSubmittedEvent.class);
                durableNotificationHandler.handleHandoverSubmitted(evt);
            }
            case "HANDOVER_ACKNOWLEDGED" -> {
                HandoverAcknowledgedEvent evt = objectMapper.readValue(json, HandoverAcknowledgedEvent.class);
                durableNotificationHandler.handleHandoverAcknowledged(evt);
            }
            case "ANNOUNCEMENT_PUBLISHED" -> {
                AnnouncementPublishedEvent evt = objectMapper.readValue(json, AnnouncementPublishedEvent.class);
                durableNotificationHandler.handleAnnouncementPublished(evt);
            }
            default -> log.warn("Unrecognized outbox event type: {}", type);
        }
    }
}
