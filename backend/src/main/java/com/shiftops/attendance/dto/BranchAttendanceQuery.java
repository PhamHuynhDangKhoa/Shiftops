package com.shiftops.attendance.dto;

import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.common.security.UserPrincipal;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record BranchAttendanceQuery(
        UUID branchId,
        Instant startDate,
        Instant endDate,
        AttendanceStatus status,
        UserPrincipal principal
) {}
