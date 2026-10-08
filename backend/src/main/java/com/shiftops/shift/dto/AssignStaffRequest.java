package com.shiftops.shift.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

@Builder
public record AssignStaffRequest(
        @NotNull(message = "User ID is required")
        UUID userId
) {
    public UUID getUserId() {
        return userId();
    }
}
