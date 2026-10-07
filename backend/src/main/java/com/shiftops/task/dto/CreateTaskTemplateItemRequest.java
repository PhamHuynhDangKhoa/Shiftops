package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskTemplateItemRequest {

    @NotBlank(message = "Task item title is required")
    @Size(max = 150, message = "Task item title cannot exceed 150 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Builder.Default
    private TaskPriority priority = TaskPriority.NORMAL;

    @Builder.Default
    private int orderIndex = 0;
}
