package com.shiftops.task.dto;

import com.shiftops.common.security.UserPrincipal;
import com.shiftops.task.entity.TaskStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record BranchTasksQuery(
        UUID branchId,
        UUID shiftId,
        UUID staffId,
        TaskStatus status,
        Instant startDate,
        Instant endDate,
        UserPrincipal principal
) {}
