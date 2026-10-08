package com.shiftops.handover.dto;

import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record AcknowledgeHandoverRequest(
        @Size(max = 1000, message = "Acknowledgement notes cannot exceed 1000 characters")
        String notes
) {
    public String getNotes() {
        return notes();
    }
}
