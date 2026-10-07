package com.shiftops.shift.dto;

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
public class UpdateShiftRequest {

    @Size(max = 100, message = "Shift name must not exceed 100 characters")
    private String name;

    private Instant startTime;

    private Instant endTime;

    private String notes;
}
