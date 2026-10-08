package com.shiftops.notification.event;

import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

public record ShiftPublishedEvent(
        UUID shiftId,
        UUID branchId,
        Collection<UUID> staffUserIds,
        String shiftName,
        Instant startTime,
        Instant endTime
) {}
