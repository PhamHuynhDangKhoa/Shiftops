package com.shiftops.shift.dto;

import com.shiftops.shift.entity.ShiftStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateShiftStatusRequest(
        @NotNull(message = "Shift status is required")
        ShiftStatus status
) {
    public ShiftStatus getStatus() {
        return status();
    }
}
