package com.shiftops.notification.event;

import java.util.UUID;

public record TaskAssignedEvent(
        UUID taskId,
        UUID shiftId,
        UUID assignedUserId,
        String taskTitle
) {}
