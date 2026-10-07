package com.shiftops.task.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTasksRequest {

    @NotNull(message = "Template ID is required")
    private UUID templateId;

    private UUID shiftAssignmentId;
}
