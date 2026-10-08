package com.shiftops.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.notification.event.*;
import com.shiftops.notification.service.NotificationEventListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Value;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxProcessor {

    private final OutboxRepository outboxRepository;
    private final OutboxService outboxService;
    private final NotificationEventListener notificationEventListener;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Value("${app.outbox.scheduler.enabled:true}")
    private boolean schedulerEnabled = true;

    private static final int BATCH_SIZE = 25;

    public void setSchedulerEnabled(boolean schedulerEnabled) {
        this.schedulerEnabled = schedulerEnabled;
    }

    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms:3000}")
    public void scheduleOutboxProcessing() {
        if (!schedulerEnabled) {
            return;
        }
        processPendingEvents();
    }

    public int processPendingEvents() {
        Instant now = clock.instant();
        List<OutboxEvent> events = outboxRepository.findEligibleEvents(now, PageRequest.of(0, BATCH_SIZE));

        if (events.isEmpty()) {
            return 0;
        }

        int processedCount = 0;
        for (OutboxEvent event : events) {
            boolean claimed = outboxService.markProcessing(event.getId());
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
                notificationEventListener.onShiftPublished(evt);
            }
            case "SHIFT_CHANGED" -> {
                ShiftChangedEvent evt = objectMapper.readValue(json, ShiftChangedEvent.class);
                notificationEventListener.onShiftChanged(evt);
            }
            case "TASK_ASSIGNED" -> {
                TaskAssignedEvent evt = objectMapper.readValue(json, TaskAssignedEvent.class);
                notificationEventListener.onTaskAssigned(evt);
            }
            case "ISSUE_ASSIGNED" -> {
                IssueAssignedEvent evt = objectMapper.readValue(json, IssueAssignedEvent.class);
                notificationEventListener.onIssueAssigned(evt);
            }
            case "ISSUE_STATUS_CHANGED" -> {
                IssueStatusChangedEvent evt = objectMapper.readValue(json, IssueStatusChangedEvent.class);
                notificationEventListener.onIssueStatusChanged(evt);
            }
            case "HANDOVER_SUBMITTED" -> {
                HandoverSubmittedEvent evt = objectMapper.readValue(json, HandoverSubmittedEvent.class);
                notificationEventListener.onHandoverSubmitted(evt);
            }
            case "HANDOVER_ACKNOWLEDGED" -> {
                HandoverAcknowledgedEvent evt = objectMapper.readValue(json, HandoverAcknowledgedEvent.class);
                notificationEventListener.onHandoverAcknowledged(evt);
            }
            case "ANNOUNCEMENT_PUBLISHED" -> {
                AnnouncementPublishedEvent evt = objectMapper.readValue(json, AnnouncementPublishedEvent.class);
                notificationEventListener.onAnnouncementPublished(evt);
            }
            default -> log.warn("Unrecognized outbox event type: {}", type);
        }
    }
}
