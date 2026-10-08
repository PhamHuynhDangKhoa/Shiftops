package com.shiftops.realtime.service;

import com.shiftops.attendance.event.StaffCheckedInEvent;
import com.shiftops.attendance.event.StaffCheckedOutEvent;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.event.*;
import com.shiftops.task.event.TaskCompletedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RealtimeEventListenerTest {

    @Mock
    private WebSocketBroadcaster broadcaster;

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private RealtimeEventListener listener;

    private UUID branchId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        branchId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void onStaffCheckedIn_BroadcastsToBranch() {
        StaffCheckedInEvent event = new StaffCheckedInEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                branchId, userId, "Staff Member", Instant.now(), false
        );

        listener.onStaffCheckedIn(event);

        verify(broadcaster).broadcastToBranch(branchId, "STAFF_CHECKED_IN", event);
    }

    @Test
    void onStaffCheckedOut_BroadcastsToBranch() {
        StaffCheckedOutEvent event = new StaffCheckedOutEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                branchId, userId, "Staff Member", Instant.now()
        );

        listener.onStaffCheckedOut(event);

        verify(broadcaster).broadcastToBranch(branchId, "STAFF_CHECKED_OUT", event);
    }

    @Test
    void onTaskCompleted_BroadcastsToBranch() {
        TaskCompletedEvent event = new TaskCompletedEvent(
                UUID.randomUUID(), UUID.randomUUID(), branchId,
                userId, "Prep inventory", userId, Instant.now()
        );

        listener.onTaskCompleted(event);

        verify(broadcaster).broadcastToBranch(branchId, "TASK_COMPLETED", event);
    }

    @Test
    void onIssueStatusChanged_BroadcastsToBranch() {
        IssueStatusChangedEvent event = new IssueStatusChangedEvent(
                UUID.randomUUID(), branchId, userId, userId,
                IssueStatus.OPEN, IssueStatus.RESOLVED, "Water leak"
        );

        listener.onIssueStatusChanged(event);

        verify(broadcaster).broadcastToBranch(branchId, "ISSUE_STATUS_CHANGED", event);
    }

    @Test
    void onHandoverSubmitted_BroadcastsToBranch() {
        HandoverSubmittedEvent event = new HandoverSubmittedEvent(
                UUID.randomUUID(), UUID.randomUUID(), branchId,
                userId, "Morning Shift"
        );

        listener.onHandoverSubmitted(event);

        verify(broadcaster).broadcastToBranch(branchId, "HANDOVER_SUBMITTED", event);
    }

    @Test
    void onHandoverAcknowledged_BroadcastsToBranch() {
        HandoverAcknowledgedEvent event = new HandoverAcknowledgedEvent(
                UUID.randomUUID(), UUID.randomUUID(), branchId,
                userId, UUID.randomUUID(), "Evening Shift"
        );

        listener.onHandoverAcknowledged(event);

        verify(broadcaster).broadcastToBranch(branchId, "HANDOVER_ACKNOWLEDGED", event);
    }

    @Test
    void onNotificationCreated_SendsNotificationToUser() {
        NotificationResponse notif = NotificationResponse.builder()
                .id(UUID.randomUUID())
                .recipientId(userId)
                .type(NotificationType.TASK_ASSIGNED)
                .title("New Task")
                .message("Clean table")
                .read(false)
                .createdAt(Instant.now())
                .build();

        NotificationCreatedEvent event = new NotificationCreatedEvent(notif, 3L);

        listener.onNotificationCreated(event);

        verify(broadcaster).sendNotification(userId, notif, 3L);
    }
}
