package com.shiftops.attendance.event;

import java.time.Instant;
import java.util.UUID;

public record StaffCheckedOutEvent(
        UUID attendanceId,
        UUID shiftAssignmentId,
        UUID shiftId,
        UUID branchId,
        UUID userId,
        String userName,
        Instant checkOutAt
) {}
