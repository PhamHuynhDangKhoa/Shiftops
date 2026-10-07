package com.shiftops.task.dto;

import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskTemplateItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplateItemResponse {
    private UUID id;
    private String title;
    private String description;
    private TaskPriority priority;
    private int orderIndex;

    public static TaskTemplateItemResponse fromEntity(TaskTemplateItem item) {
        return TaskTemplateItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .priority(item.getPriority())
                .orderIndex(item.getOrderIndex())
                .build();
    }
}
