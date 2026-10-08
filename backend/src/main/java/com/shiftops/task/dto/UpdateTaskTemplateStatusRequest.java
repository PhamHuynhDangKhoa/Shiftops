package com.shiftops.task.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateTaskTemplateStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {
    public Boolean getActive() {
        return active();
    }
}
