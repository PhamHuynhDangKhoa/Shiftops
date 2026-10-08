package com.shiftops.shift.dto;

import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;

@Builder
public record UpdateShiftRequest(
        @Size(max = 100, message = "Shift name must not exceed 100 characters")
        String name,

        Instant startTime,

        Instant endTime,

        String notes
) {
    public String getName() {
        return name();
    }

    public Instant getStartTime() {
        return startTime();
    }

    public Instant getEndTime() {
        return endTime();
    }

    public String getNotes() {
        return notes();
    }
}
