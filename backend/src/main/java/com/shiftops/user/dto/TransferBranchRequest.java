package com.shiftops.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

@Builder
public record TransferBranchRequest(
        @NotNull(message = "Target branch ID is required")
        UUID targetBranchId
) {
    public UUID getTargetBranchId() {
        return targetBranchId();
    }
}
