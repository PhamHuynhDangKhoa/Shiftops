package com.shiftops.announcement.dto;

import com.shiftops.announcement.entity.Announcement;
import com.shiftops.announcement.entity.AnnouncementTargetType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record AnnouncementResponse(
        UUID id,
        UUID branchId,
        String branchName,
        UUID createdById,
        String createdByName,
        String title,
        String content,
        AnnouncementTargetType targetType,
        UUID targetShiftId,
        String targetShiftName,
        Instant publishedAt,
        boolean published,
        Instant expiresAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static AnnouncementResponse fromEntity(Announcement announcement) {
        UUID branchId = announcement.getBranch() != null ? announcement.getBranch().getId() : null;
        String branchName = announcement.getBranch() != null ? announcement.getBranch().getName() : null;
        UUID shiftId = announcement.getTargetShift() != null ? announcement.getTargetShift().getId() : null;
        String shiftName = announcement.getTargetShift() != null ? announcement.getTargetShift().getName() : null;

        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .branchId(branchId)
                .branchName(branchName)
                .createdById(announcement.getCreatedBy().getId())
                .createdByName(announcement.getCreatedBy().getFullName())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .targetType(announcement.getTargetType())
                .targetShiftId(shiftId)
                .targetShiftName(shiftName)
                .publishedAt(announcement.getPublishedAt())
                .published(announcement.isPublished())
                .expiresAt(announcement.getExpiresAt())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public UUID getCreatedById() {
        return createdById();
    }

    public String getCreatedByName() {
        return createdByName();
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

    public String getTargetShiftName() {
        return targetShiftName();
    }

    public Instant getPublishedAt() {
        return publishedAt();
    }

    public boolean isPublished() {
        return published();
    }

    public Instant getExpiresAt() {
        return expiresAt();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
