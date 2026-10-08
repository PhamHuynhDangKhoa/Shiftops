package com.shiftops.common.outbox;

import com.shiftops.notification.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxEventListener {

    private final OutboxService outboxService;
    private final ObjectProvider<OutboxProcessor> outboxProcessorProvider;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onShiftPublished(ShiftPublishedEvent event) {
        outboxService.saveEvent("SHIFT_PUBLISHED", "SHIFT", event.shiftId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onShiftChanged(ShiftChangedEvent event) {
        outboxService.saveEvent("SHIFT_CHANGED", "SHIFT", event.shiftId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onTaskAssigned(TaskAssignedEvent event) {
        outboxService.saveEvent("TASK_ASSIGNED", "TASK", event.taskId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onIssueAssigned(IssueAssignedEvent event) {
        outboxService.saveEvent("ISSUE_ASSIGNED", "ISSUE", event.issueId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onIssueStatusChanged(IssueStatusChangedEvent event) {
        outboxService.saveEvent("ISSUE_STATUS_CHANGED", "ISSUE", event.issueId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onHandoverSubmitted(HandoverSubmittedEvent event) {
        outboxService.saveEvent("HANDOVER_SUBMITTED", "HANDOVER", event.handoverId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onHandoverAcknowledged(HandoverAcknowledgedEvent event) {
        outboxService.saveEvent("HANDOVER_ACKNOWLEDGED", "HANDOVER", event.handoverId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onAnnouncementPublished(AnnouncementPublishedEvent event) {
        outboxService.saveEvent("ANNOUNCEMENT_PUBLISHED", "ANNOUNCEMENT", event.announcementId(), event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onShiftPublishedCommitted(ShiftPublishedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onShiftChangedCommitted(ShiftChangedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskAssignedCommitted(TaskAssignedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onIssueAssignedCommitted(IssueAssignedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onIssueStatusChangedCommitted(IssueStatusChangedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onHandoverSubmittedCommitted(HandoverSubmittedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onHandoverAcknowledgedCommitted(HandoverAcknowledgedEvent event) {
        triggerOutboxProcessing();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAnnouncementPublishedCommitted(AnnouncementPublishedEvent event) {
        triggerOutboxProcessing();
    }

    private void triggerOutboxProcessing() {
        try {
            OutboxProcessor processor = outboxProcessorProvider.getIfAvailable();
            if (processor != null) {
                processor.processPendingEvents();
            }
        } catch (Exception ex) {
            log.debug("Immediate post-commit outbox trigger will be retried by scheduled poller: {}", ex.getMessage());
        }
    }
}
