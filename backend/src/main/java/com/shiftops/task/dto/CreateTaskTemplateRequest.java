package com.shiftops.task.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Builder
public record CreateTaskTemplateRequest(
        @NotBlank(message = "Template name is required")
        @Size(max = 100, message = "Template name cannot exceed 100 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        @Valid
        List<CreateTaskTemplateItemRequest> items
) {
    public CreateTaskTemplateRequest {
        if (items == null) {
            items = new ArrayList<>();
        }
    }

    public String getName() {
        return name();
    }

    public String getDescription() {
        return description();
    }

    public List<CreateTaskTemplateItemRequest> getItems() {
        return items();
    }
}
