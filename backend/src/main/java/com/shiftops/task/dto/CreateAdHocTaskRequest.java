package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;

@Builder
public record CreateAdHocTaskRequest(
        @NotBlank(message = "Task title is required")
        @Size(max = 150, message = "Task title cannot exceed 150 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        TaskPriority priority,

        Instant dueTime
) {
    public CreateAdHocTaskRequest {
        if (priority == null) {
            priority = TaskPriority.NORMAL;
        }
    }

    public String getTitle() {
        return title();
    }

    public String getDescription() {
        return description();
    }

    public TaskPriority getPriority() {
        return priority();
    }

    public Instant getDueTime() {
        return dueTime();
    }
}
