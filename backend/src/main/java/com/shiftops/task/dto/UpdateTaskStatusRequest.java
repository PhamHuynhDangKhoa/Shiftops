package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateTaskStatusRequest(
        @NotNull(message = "Task status is required")
        TaskStatus status
) {
    public TaskStatus getStatus() {
        return status();
    }
}
