package com.shiftops.notification.event;

import java.util.UUID;

public record HandoverSubmittedEvent(
        UUID handoverId,
        UUID shiftId,
        UUID branchId,
        UUID submittedByUserId,
        String shiftName
) {}
