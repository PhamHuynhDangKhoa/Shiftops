package com.shiftops.notification.dto;

import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record NotificationResponse(
        UUID id,
        UUID recipientId,
        NotificationType type,
        String title,
        String message,
        ReferenceType referenceType,
        UUID referenceId,
        Instant readAt,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .readAt(notification.getReadAt())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getRecipientId() {
        return recipientId();
    }

    public NotificationType getType() {
        return type();
    }

    public String getTitle() {
        return title();
    }

    public String getMessage() {
        return message();
    }

    public ReferenceType getReferenceType() {
        return referenceType();
    }

    public UUID getReferenceId() {
        return referenceId();
    }

    public Instant getReadAt() {
        return readAt();
    }

    public boolean isRead() {
        return read();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }
}
