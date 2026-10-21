package com.shiftops.notification.service;

import com.shiftops.announcement.entity.AnnouncementTargetType;
import com.shiftops.notification.dto.CreateNotificationCommand;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.event.*;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Dedicated handler for durable, transactional event dispatching backed by Spring Modulith.
 * Managed automatically by the Spring Modulith Event Publication Registry.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DurableNotificationHandler {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;

    @ApplicationModuleListener
    public void handleShiftPublished(ShiftPublishedEvent event) {
        if (event.staffUserIds() == null) return;
        for (UUID staffId : event.staffUserIds()) {
            notificationService.createNotification(CreateNotificationCommand.builder()
                    .recipientId(staffId)
                    .type(NotificationType.SHIFT_PUBLISHED)
                    .title("Shift Published")
                    .message("You have been scheduled for " + event.shiftName())
                    .referenceType(ReferenceType.SHIFT)
                    .referenceId(event.shiftId())
                    .build());
        }
    }

    @ApplicationModuleListener
    public void handleShiftChanged(ShiftChangedEvent event) {
        if (event.staffUserIds() == null) return;
        for (UUID staffId : event.staffUserIds()) {
            String key = "shift:" + event.shiftId() + ":change:" + (event.changeSummary() != null ? event.changeSummary().hashCode() : "all") + ":user:" + staffId;
            notificationService.createNotification(CreateNotificationCommand.builder()
                    .recipientId(staffId)
                    .type(NotificationType.SHIFT_CHANGED)
                    .title("Shift Changed")
                    .message("Shift update for " + event.shiftName() + ": " + event.changeSummary())
                    .referenceType(ReferenceType.SHIFT)
                    .referenceId(event.shiftId())
                    .idempotencyKey(key)
                    .build());
        }
    }

    @ApplicationModuleListener
    public void handleTaskAssigned(TaskAssignedEvent event) {
        if (event.assignedUserId() == null) return;
        notificationService.createNotification(CreateNotificationCommand.builder()
                .recipientId(event.assignedUserId())
                .type(NotificationType.TASK_ASSIGNED)
                .title("New Task Assigned")
                .message("You were assigned task: " + event.taskTitle())
                .referenceType(ReferenceType.TASK)
                .referenceId(event.taskId())
                .build());
    }

    @ApplicationModuleListener
    public void handleIssueAssigned(IssueAssignedEvent event) {
        if (event.assignedToUserId() == null) return;
        notificationService.createNotification(CreateNotificationCommand.builder()
                .recipientId(event.assignedToUserId())
                .type(NotificationType.ISSUE_ASSIGNED)
                .title("Issue Assigned to You")
                .message("You were assigned issue: " + event.issueTitle())
                .referenceType(ReferenceType.ISSUE)
                .referenceId(event.issueId())
                .build());
    }

    @ApplicationModuleListener
    public void handleIssueStatusChanged(IssueStatusChangedEvent event) {
        String msg = "Issue '" + event.issueTitle() + "' status changed to " + event.newStatus();
        Set<UUID> recipients = new HashSet<>();
        if (event.reporterUserId() != null) {
            recipients.add(event.reporterUserId());
        }
        if (event.assigneeUserId() != null) {
            recipients.add(event.assigneeUserId());
        }

        for (UUID recipientId : recipients) {
            String key = "issue:" + event.issueId() + ":status:" + event.newStatus() + ":user:" + recipientId;
            notificationService.createNotification(CreateNotificationCommand.builder()
                    .recipientId(recipientId)
                    .type(NotificationType.ISSUE_UPDATED)
                    .title("Issue Status Changed")
                    .message(msg)
                    .referenceType(ReferenceType.ISSUE)
                    .referenceId(event.issueId())
                    .idempotencyKey(key)
                    .build());
        }
    }

    @ApplicationModuleListener
    public void handleHandoverSubmitted(HandoverSubmittedEvent event) {
        List<User> branchUsers = userRepository.findByPrimaryBranchIdAndIsActiveTrue(event.branchId());
        for (User user : branchUsers) {
            if (!user.getId().equals(event.submittedByUserId())) {
                notificationService.createNotification(CreateNotificationCommand.builder()
                        .recipientId(user.getId())
                        .type(NotificationType.HANDOVER_SUBMITTED)
                        .title("Shift Handover Submitted")
                        .message("Shift handover submitted for " + (event.shiftName() != null ? event.shiftName() : "shift"))
                        .referenceType(ReferenceType.HANDOVER)
                        .referenceId(event.handoverId())
                        .build());
            }
        }
    }

    @ApplicationModuleListener
    public void handleHandoverAcknowledged(HandoverAcknowledgedEvent event) {
        if (event.submitterUserId() == null) return;
        notificationService.createNotification(CreateNotificationCommand.builder()
                .recipientId(event.submitterUserId())
                .type(NotificationType.HANDOVER_ACKNOWLEDGED)
                .title("Handover Acknowledged")
                .message("Your shift handover for " + (event.shiftName() != null ? event.shiftName() : "shift") + " has been acknowledged")
                .referenceType(ReferenceType.HANDOVER)
                .referenceId(event.handoverId())
                .build());
    }

    @ApplicationModuleListener
    public void handleAnnouncementPublished(AnnouncementPublishedEvent event) {
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
            notificationService.createNotification(CreateNotificationCommand.builder()
                    .recipientId(recipientId)
                    .type(NotificationType.ANNOUNCEMENT_PUBLISHED)
                    .title("Announcement: " + event.title())
                    .message(event.content())
                    .referenceType(ReferenceType.ANNOUNCEMENT)
                    .referenceId(event.announcementId())
                    .build());
        }
    }
}
