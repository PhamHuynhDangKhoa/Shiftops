package com.shiftops.shift.dto;

import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.entity.ShiftStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record BranchShiftsQuery(
        UUID branchId,
        Instant startDate,
        Instant endDate,
        ShiftStatus status,
        UserPrincipal principal
) {}
