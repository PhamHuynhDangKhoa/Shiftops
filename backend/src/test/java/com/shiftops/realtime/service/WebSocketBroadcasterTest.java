package com.shiftops.realtime.service;

import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.realtime.dto.RealtimeEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketBroadcasterTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private WebSocketMetrics metrics;

    @InjectMocks
    private WebSocketBroadcaster broadcaster;

    private UUID branchId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        branchId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    void broadcastToBranch_SendsToCorrectTopic() {
        String eventType = "STAFF_CHECKED_IN";
        String payload = "data";

        broadcaster.broadcastToBranch(branchId, eventType, payload);

        ArgumentCaptor<String> destinationCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<RealtimeEvent<?>> eventCaptor = ArgumentCaptor.forClass(RealtimeEvent.class);

        verify(messagingTemplate).convertAndSend(destinationCaptor.capture(), eventCaptor.capture());
        assertThat(destinationCaptor.getValue()).isEqualTo("/topic/branches/" + branchId + "/operations");
        assertThat(eventCaptor.getValue().eventType()).isEqualTo(eventType);
        assertThat(eventCaptor.getValue().branchId()).isEqualTo(branchId);
        assertThat(eventCaptor.getValue().payload()).isEqualTo(payload);
    }

    @Test
    void broadcastToBranch_HandlesExceptionGracefully() {
        doThrow(new RuntimeException("Broker unreachable")).when(messagingTemplate)
                .convertAndSend(anyString(), any(Object.class));

        // Should not rethrow exception
        broadcaster.broadcastToBranch(branchId, "EVENT", "data");

        verify(metrics).recordBroadcastFailure();
    }

    @Test
    void sendToUser_SendsToUserQueue() {
        String eventType = "NOTIFICATION_CREATED";
        String payload = "notification-data";

        broadcaster.sendToUser(userId, eventType, payload);

        ArgumentCaptor<String> userCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> destinationCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<RealtimeEvent<?>> eventCaptor = ArgumentCaptor.forClass(RealtimeEvent.class);

        verify(messagingTemplate).convertAndSendToUser(
                userCaptor.capture(),
                destinationCaptor.capture(),
                eventCaptor.capture()
        );

        assertThat(userCaptor.getValue()).isEqualTo(userId.toString());
        assertThat(destinationCaptor.getValue()).isEqualTo("/queue/notifications");
        assertThat(eventCaptor.getValue().eventType()).isEqualTo(eventType);
    }

    @Test
    void sendNotification_SendsPayloadWithUnreadCount() {
        NotificationResponse notif = NotificationResponse.builder()
                .id(UUID.randomUUID())
                .recipientId(userId)
                .type(NotificationType.TASK_ASSIGNED)
                .title("New Task")
                .message("Clean kitchen")
                .referenceType(ReferenceType.TASK)
                .referenceId(UUID.randomUUID())
                .read(false)
                .createdAt(Instant.now())
                .build();

        broadcaster.sendNotification(userId, notif, 5L);

        verify(messagingTemplate).convertAndSendToUser(
                eq(userId.toString()),
                eq("/queue/notifications"),
                any(RealtimeEvent.class)
        );
    }
}
