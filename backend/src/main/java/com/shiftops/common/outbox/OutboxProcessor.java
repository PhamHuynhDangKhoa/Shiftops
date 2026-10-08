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
    private final OutboxProperties outboxProperties;
    private final DurableNotificationHandler durableNotificationHandler;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public void setSchedulerEnabled(boolean schedulerEnabled) {
        this.outboxProperties.getScheduler().setEnabled(schedulerEnabled);
    }

    public void setStaleThresholdSeconds(long staleThresholdSeconds) {
        this.outboxProperties.setStaleThresholdSeconds(staleThresholdSeconds);
    }

    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms:3000}")
    public void scheduleOutboxProcessing() {
        if (!outboxProperties.getScheduler().isEnabled()) {
            return;
        }
        processPendingEvents();
    }

    public int processPendingEvents() {
        // 1. Recover stale processing events first
        try {
            outboxService.recoverStaleEvents(Duration.ofSeconds(outboxProperties.getStaleThresholdSeconds()));
        } catch (Exception ex) {
            log.warn("Error running stale outbox event recovery: {}", ex.getMessage());
        }

        // 2. Fetch eligible events
        Instant now = clock.instant();
        List<OutboxEvent> events = outboxRepository.findEligibleEvents(now, PageRequest.of(0, outboxProperties.getBatchSize()));

        if (events.isEmpty()) {
            return 0;
        }

        int processedCount = 0;
        for (OutboxEvent event : events) {
            java.util.Optional<java.util.UUID> claimTokenOpt;
            try {
                claimTokenOpt = outboxService.claimEvent(event.getId());
            } catch (OptimisticLockingFailureException ex) {
                log.debug("Event {} was claimed concurrently by another worker", event.getId());
                continue;
            } catch (Exception ex) {
                log.warn("Failed to claim event {}: {}", event.getId(), ex.getMessage());
                continue;
            }

            if (claimTokenOpt.isEmpty()) {
                continue;
            }
            java.util.UUID claimToken = claimTokenOpt.get();

            try {
                dispatchOutboxEvent(event);
                outboxService.markProcessed(event.getId(), claimToken);
                processedCount++;
            } catch (Exception ex) {
                log.error("Error processing outbox event: id={}, type={}", event.getId(), event.getEventType(), ex);
                outboxService.markFailed(event.getId(), claimToken, ex.getMessage());
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
