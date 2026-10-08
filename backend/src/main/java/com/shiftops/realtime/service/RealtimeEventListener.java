package com.shiftops.realtime.service;

import com.shiftops.attendance.event.StaffCheckedInEvent;
import com.shiftops.attendance.event.StaffCheckedOutEvent;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.notification.event.AnnouncementPublishedEvent;
import com.shiftops.notification.event.HandoverAcknowledgedEvent;
import com.shiftops.notification.event.HandoverSubmittedEvent;
import com.shiftops.notification.event.IssueStatusChangedEvent;
import com.shiftops.notification.event.NotificationCreatedEvent;
import com.shiftops.task.event.TaskCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimeEventListener {

    private final WebSocketBroadcaster broadcaster;
    private final BranchRepository branchRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onStaffCheckedIn(StaffCheckedInEvent event) {
        log.info("Handling StaffCheckedInEvent for attendance {} at branch {}",
                event.attendanceId(), event.branchId());
        broadcaster.broadcastToBranch(event.branchId(), "STAFF_CHECKED_IN", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onStaffCheckedOut(StaffCheckedOutEvent event) {
        log.info("Handling StaffCheckedOutEvent for attendance {} at branch {}",
                event.attendanceId(), event.branchId());
        broadcaster.broadcastToBranch(event.branchId(), "STAFF_CHECKED_OUT", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onTaskCompleted(TaskCompletedEvent event) {
        log.info("Handling TaskCompletedEvent for task {} at branch {}",
                event.taskId(), event.branchId());
        broadcaster.broadcastToBranch(event.branchId(), "TASK_COMPLETED", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onIssueStatusChanged(IssueStatusChangedEvent event) {
        log.info("Handling IssueStatusChangedEvent for issue {} at branch {}: {} -> {}",
                event.issueId(), event.branchId(), event.oldStatus(), event.newStatus());
        broadcaster.broadcastToBranch(event.branchId(), "ISSUE_STATUS_CHANGED", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onHandoverSubmitted(HandoverSubmittedEvent event) {
        log.info("Handling HandoverSubmittedEvent for handover {} at branch {}",
                event.handoverId(), event.branchId());
        broadcaster.broadcastToBranch(event.branchId(), "HANDOVER_SUBMITTED", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onHandoverAcknowledged(HandoverAcknowledgedEvent event) {
        log.info("Handling HandoverAcknowledgedEvent for handover {} at branch {}",
                event.handoverId(), event.branchId());
        broadcaster.broadcastToBranch(event.branchId(), "HANDOVER_ACKNOWLEDGED", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAnnouncementPublished(AnnouncementPublishedEvent event) {
        log.info("Handling AnnouncementPublishedEvent for announcement {}, targetType {}",
                event.announcementId(), event.targetType());

        if (event.branchId() != null) {
            broadcaster.broadcastToBranch(event.branchId(), "ANNOUNCEMENT_PUBLISHED", event);
        } else {
            // Organization-wide announcement: broadcast to all active branches
            branchRepository.findAll().stream()
                    .filter(b -> b.isActive())
                    .forEach(b -> broadcaster.broadcastToBranch(b.getId(), "ANNOUNCEMENT_PUBLISHED", event));
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNotificationCreated(NotificationCreatedEvent event) {
        log.info("Handling NotificationCreatedEvent for user {}, notification {}, unreadCount {}",
                event.notification().getRecipientId(), event.notification().getId(), event.unreadCount());
        broadcaster.sendNotification(
                event.notification().getRecipientId(),
                event.notification(),
                event.unreadCount()
        );
    }
}
