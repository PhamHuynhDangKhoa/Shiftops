package com.shiftops.branch.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateBranchStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {
    public Boolean getActive() {
        return active();
    }
}
