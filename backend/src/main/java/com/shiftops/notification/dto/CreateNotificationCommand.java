package com.shiftops.notification.dto;

import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateNotificationCommand(
        UUID recipientId,
        NotificationType type,
        String title,
        String message,
        ReferenceType referenceType,
        UUID referenceId,
        String idempotencyKey
) {
    public CreateNotificationCommand(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            ReferenceType referenceType,
            UUID referenceId
    ) {
        this(recipientId, type, title, message, referenceType, referenceId, null);
    }
}
