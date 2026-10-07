package com.shiftops.shift.dto;

import com.shiftops.shift.entity.ShiftStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShiftStatusRequest {

    @NotNull(message = "Shift status is required")
    private ShiftStatus status;
}
