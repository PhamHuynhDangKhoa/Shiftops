package com.shiftops.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateUserStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {
    public Boolean getActive() {
        return active();
    }
}
