package com.shiftops.notification.event;

import java.util.Collection;
import java.util.UUID;

public record ShiftChangedEvent(
        UUID shiftId,
        UUID branchId,
        Collection<UUID> staffUserIds,
        String shiftName,
        String changeSummary
) {}
