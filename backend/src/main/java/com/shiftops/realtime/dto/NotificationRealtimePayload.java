package com.shiftops.realtime.dto;

import com.shiftops.notification.dto.NotificationResponse;

public record NotificationRealtimePayload(
        NotificationResponse notification,
        long unreadCount
) {}
