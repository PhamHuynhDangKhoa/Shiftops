package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskTemplateItem;
import lombok.Builder;

import java.util.UUID;

@Builder
public record TaskTemplateItemResponse(
        UUID id,
        String title,
        String description,
        TaskPriority priority,
        int orderIndex
) {
    public static TaskTemplateItemResponse fromEntity(TaskTemplateItem item) {
        return TaskTemplateItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .priority(item.getPriority())
                .orderIndex(item.getOrderIndex())
                .build();
    }

    public UUID getId() {
        return id();
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
