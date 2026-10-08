package com.shiftops.realtime.service;

import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.realtime.dto.NotificationRealtimePayload;
import com.shiftops.realtime.dto.RealtimeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketMetrics metrics;

    public void broadcastToBranch(UUID branchId, String eventType, Object payload) {
        if (branchId == null) {
            log.debug("Skipping branch broadcast with null branchId for event {}", eventType);
            return;
        }
        String destination = "/topic/branches/" + branchId + "/operations";
        RealtimeEvent<Object> event = RealtimeEvent.of(eventType, branchId, payload);
        try {
            messagingTemplate.convertAndSend(destination, event);
            log.debug("Broadcasted {} to {}", eventType, destination);
        } catch (Exception e) {
            metrics.recordBroadcastFailure();
            log.error("Failed to broadcast {} to {}: {}", eventType, destination, e.getMessage());
        }
    }

    public void sendToUser(UUID userId, String eventType, Object payload) {
        if (userId == null) {
            log.debug("Skipping user notification with null userId for event {}", eventType);
            return;
        }
        String destination = "/queue/notifications";
        RealtimeEvent<Object> event = RealtimeEvent.of(eventType, null, payload);
        try {
            messagingTemplate.convertAndSendToUser(userId.toString(), destination, event);
            log.debug("Sent {} to user {} at /user/{}", eventType, userId, destination);
        } catch (Exception e) {
            metrics.recordBroadcastFailure();
            log.error("Failed to send {} to user {}: {}", eventType, userId, e.getMessage());
        }
    }

    public void sendNotification(UUID userId, NotificationResponse notification, long unreadCount) {
        NotificationRealtimePayload payload = new NotificationRealtimePayload(notification, unreadCount);
        sendToUser(userId, "NOTIFICATION_CREATED", payload);
    }
}
