package com.shiftops.notification.event;

import com.shiftops.announcement.entity.AnnouncementTargetType;

import java.util.UUID;

public record AnnouncementPublishedEvent(
        UUID announcementId,
        UUID branchId,
        AnnouncementTargetType targetType,
        UUID targetShiftId,
        String title,
        String content
) {}
