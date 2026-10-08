package com.shiftops.shift.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;

@Builder
public record CreateShiftRequest(
        @Size(max = 100, message = "Shift name must not exceed 100 characters")
        String name,

        @NotNull(message = "Start time is required")
        Instant startTime,

        @NotNull(message = "End time is required")
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
