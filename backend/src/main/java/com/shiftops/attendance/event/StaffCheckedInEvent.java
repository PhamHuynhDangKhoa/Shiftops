package com.shiftops.attendance.event;

import java.time.Instant;
import java.util.UUID;

public record StaffCheckedInEvent(
        UUID attendanceId,
        UUID shiftAssignmentId,
        UUID shiftId,
        UUID branchId,
        UUID userId,
        String userName,
        Instant checkInAt,
        boolean isLate
) {}
