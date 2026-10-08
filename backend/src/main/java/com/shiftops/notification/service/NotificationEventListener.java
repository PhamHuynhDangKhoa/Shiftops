package com.shiftops.notification.service;

import com.shiftops.announcement.entity.AnnouncementTargetType;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.event.*;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onShiftPublished(ShiftPublishedEvent event) {
        if (event.staffUserIds() == null) return;
        for (UUID staffId : event.staffUserIds()) {
            notificationService.createNotification(
                    staffId,
                    NotificationType.SHIFT_PUBLISHED,
                    "Shift Published",
                    "You have been scheduled for " + event.shiftName(),
                    ReferenceType.SHIFT,
                    event.shiftId()
            );
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onShiftChanged(ShiftChangedEvent event) {
        if (event.staffUserIds() == null) return;
        for (UUID staffId : event.staffUserIds()) {
            notificationService.createNotification(
                    staffId,
                    NotificationType.SHIFT_CHANGED,
                    "Shift Changed",
                    "Shift update for " + event.shiftName() + ": " + event.changeSummary(),
                    ReferenceType.SHIFT,
                    event.shiftId()
            );
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onTaskAssigned(TaskAssignedEvent event) {
        if (event.assignedUserId() == null) return;
        notificationService.createNotification(
                event.assignedUserId(),
                NotificationType.TASK_ASSIGNED,
                "New Task Assigned",
                "You were assigned task: " + event.taskTitle(),
                ReferenceType.TASK,
                event.taskId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onIssueAssigned(IssueAssignedEvent event) {
        if (event.assignedToUserId() == null) return;
        notificationService.createNotification(
                event.assignedToUserId(),
                NotificationType.ISSUE_ASSIGNED,
                "Issue Assigned to You",
                "You were assigned issue: " + event.issueTitle(),
                ReferenceType.ISSUE,
                event.issueId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onIssueStatusChanged(IssueStatusChangedEvent event) {
        String msg = "Issue '" + event.issueTitle() + "' status changed to " + event.newStatus();
        Set<UUID> recipients = new HashSet<>();
        if (event.reporterUserId() != null) {
            recipients.add(event.reporterUserId());
        }
        if (event.assigneeUserId() != null) {
            recipients.add(event.assigneeUserId());
        }

        for (UUID recipientId : recipients) {
            notificationService.createNotification(
                    recipientId,
                    NotificationType.ISSUE_UPDATED,
                    "Issue Status Changed",
                    msg,
                    ReferenceType.ISSUE,
                    event.issueId()
            );
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onHandoverSubmitted(HandoverSubmittedEvent event) {
        // Notify branch managers and active branch staff
        List<User> branchUsers = userRepository.findByPrimaryBranchIdAndIsActiveTrue(event.branchId());
        for (User user : branchUsers) {
            // Do not notify the submitter of their own submission
            if (!user.getId().equals(event.submittedByUserId())) {
                notificationService.createNotification(
                        user.getId(),
                        NotificationType.HANDOVER_SUBMITTED,
                        "Shift Handover Submitted",
                        "Shift handover submitted for " + (event.shiftName() != null ? event.shiftName() : "shift"),
                        ReferenceType.HANDOVER,
                        event.handoverId()
                );
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onHandoverAcknowledged(HandoverAcknowledgedEvent event) {
        if (event.submitterUserId() == null) return;
        notificationService.createNotification(
                event.submitterUserId(),
                NotificationType.HANDOVER_ACKNOWLEDGED,
                "Handover Acknowledged",
                "Your shift handover for " + (event.shiftName() != null ? event.shiftName() : "shift") + " has been acknowledged",
                ReferenceType.HANDOVER,
                event.handoverId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAnnouncementPublished(AnnouncementPublishedEvent event) {
        Set<UUID> recipientIds = new HashSet<>();

        if (event.targetType() == AnnouncementTargetType.ORGANIZATION) {
            userRepository.findByIsActiveTrue()
                    .forEach(u -> recipientIds.add(u.getId()));
        } else if (event.targetType() == AnnouncementTargetType.SHIFT && event.targetShiftId() != null) {
            shiftAssignmentRepository.findByShiftId(event.targetShiftId())
                    .stream()
                    .filter(sa -> sa.getUser().isActive())
                    .forEach(sa -> recipientIds.add(sa.getUser().getId()));
        } else if (event.branchId() != null) {
            userRepository.findByPrimaryBranchIdAndIsActiveTrue(event.branchId())
                    .forEach(u -> recipientIds.add(u.getId()));
        }

        for (UUID recipientId : recipientIds) {
            notificationService.createNotification(
                    recipientId,
                    NotificationType.ANNOUNCEMENT_PUBLISHED,
                    "Announcement: " + event.title(),
                    event.content(),
                    ReferenceType.ANNOUNCEMENT,
                    event.announcementId()
            );
        }
    }
}
