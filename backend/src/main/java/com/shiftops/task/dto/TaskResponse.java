package com.shiftops.task.dto;

import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private UUID id;
    private UUID shiftAssignmentId;
    private UUID shiftId;
    private String shiftName;
    private UUID branchId;
    private String branchName;
    private UUID userId;
    private String userName;
    private String userEmail;
    private UUID templateItemId;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private Instant dueTime;
    private Instant completedAt;
    private UUID completedById;
    private String completedByName;
    private Instant createdAt;
    private Instant updatedAt;
    private Long version;

    public static TaskResponse fromEntity(Task task) {
        ShiftAssignment sa = task.getShiftAssignment();
        Shift shift = sa.getShift();
        User staff = sa.getUser();

        return TaskResponse.builder()
                .id(task.getId())
                .shiftAssignmentId(sa.getId())
                .shiftId(shift.getId())
                .shiftName(shift.getName())
                .branchId(shift.getBranch().getId())
                .branchName(shift.getBranch().getName())
                .userId(staff.getId())
                .userName(staff.getFullName())
                .userEmail(staff.getEmail())
                .templateItemId(task.getTemplateItem() != null ? task.getTemplateItem().getId() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueTime(task.getDueTime())
                .completedAt(task.getCompletedAt())
                .completedById(task.getCompletedBy() != null ? task.getCompletedBy().getId() : null)
                .completedByName(task.getCompletedBy() != null ? task.getCompletedBy().getFullName() : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .version(task.getVersion())
                .build();
    }
}
