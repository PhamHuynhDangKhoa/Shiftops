package com.shiftops.shift.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShiftRequest {

    @Size(max = 100, message = "Shift name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Start time is required")
    private Instant startTime;

    @NotNull(message = "End time is required")
    private Instant endTime;

    private String notes;
}
