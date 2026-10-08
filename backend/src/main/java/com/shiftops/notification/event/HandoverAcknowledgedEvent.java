package com.shiftops.notification.event;

import java.util.UUID;

public record HandoverAcknowledgedEvent(
        UUID handoverId,
        UUID shiftId,
        UUID branchId,
        UUID acknowledgedByUserId,
        UUID submitterUserId,
        String shiftName
) {}
