package com.shiftops.shift.dto;

import com.shiftops.common.security.UserPrincipal;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateShiftCommand(
        UUID branchId,
        CreateShiftRequest request,
        UserPrincipal principal
) {}
