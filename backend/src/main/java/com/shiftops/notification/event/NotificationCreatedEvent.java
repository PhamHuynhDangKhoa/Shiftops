package com.shiftops.notification.event;

import com.shiftops.notification.dto.NotificationResponse;

public record NotificationCreatedEvent(
        NotificationResponse notification,
        long unreadCount
) {}
