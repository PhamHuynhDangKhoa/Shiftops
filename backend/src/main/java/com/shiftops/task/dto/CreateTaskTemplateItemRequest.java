package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record CreateTaskTemplateItemRequest(
        @NotBlank(message = "Task item title is required")
        @Size(max = 150, message = "Task item title cannot exceed 150 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        TaskPriority priority,

        int orderIndex
) {
    public CreateTaskTemplateItemRequest {
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

    public int getOrderIndex() {
        return orderIndex();
    }
}
