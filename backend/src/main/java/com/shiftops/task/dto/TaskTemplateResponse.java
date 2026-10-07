package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplateResponse {
    private UUID id;
    private UUID branchId;
    private String branchName;
    private String name;
    private String description;
    private boolean active;
    private List<TaskTemplateItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
    private Long version;

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
}
