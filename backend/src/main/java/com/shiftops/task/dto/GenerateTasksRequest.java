package com.shiftops.task.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

@Builder
public record GenerateTasksRequest(
        @NotNull(message = "Template ID is required")
        UUID templateId,

        UUID shiftAssignmentId
) {
    public UUID getTemplateId() {
        return templateId();
    }

    public UUID getShiftAssignmentId() {
        return shiftAssignmentId();
    }
}
