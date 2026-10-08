package com.shiftops.announcement.dto;

import com.shiftops.announcement.entity.AnnouncementTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record CreateAnnouncementRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @NotBlank(message = "Content is required")
        String content,

        AnnouncementTargetType targetType,

        UUID targetShiftId,

        Instant expiresAt,

        Boolean publishImmediately
) {
    public CreateAnnouncementRequest {
        if (targetType == null) {
            targetType = AnnouncementTargetType.BRANCH;
        }
        if (publishImmediately == null) {
            publishImmediately = true;
        }
    }

    public String getTitle() {
        return title();
    }

    public String getContent() {
        return content();
    }

    public AnnouncementTargetType getTargetType() {
        return targetType();
    }

    public UUID getTargetShiftId() {
        return targetShiftId();
    }

    public Instant getExpiresAt() {
        return expiresAt();
    }

    public Boolean getPublishImmediately() {
        return publishImmediately();
    }
}
