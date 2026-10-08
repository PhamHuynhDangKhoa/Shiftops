package com.shiftops.task.event;

import java.time.Instant;
import java.util.UUID;

public record TaskCompletedEvent(
        UUID taskId,
        UUID shiftId,
        UUID branchId,
        UUID assignedUserId,
        String taskTitle,
        UUID completedByUserId,
        Instant completedAt
) {}
