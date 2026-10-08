package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskTemplate;
import lombok.Builder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record TaskTemplateResponse(
        UUID id,
        UUID branchId,
        String branchName,
        String name,
        String description,
        boolean active,
        List<TaskTemplateItemResponse> items,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
    public static TaskTemplateResponse fromEntity(TaskTemplate template) {
        List<TaskTemplateItemResponse> itemResponses = template.getItems() != null
                ? template.getItems().stream().map(TaskTemplateItemResponse::fromEntity).toList()
                : Collections.emptyList();

        return TaskTemplateResponse.builder()
                .id(template.getId())
                .branchId(template.getBranch().getId())
                .branchName(template.getBranch().getName())
                .name(template.getName())
                .description(template.getDescription())
                .active(template.isActive())
                .items(itemResponses)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .version(template.getVersion())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public String getName() {
        return name();
    }

    public String getDescription() {
        return description();
    }

    public boolean isActive() {
        return active();
    }

    public List<TaskTemplateItemResponse> getItems() {
        return items();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }

    public Long getVersion() {
        return version();
    }
}
