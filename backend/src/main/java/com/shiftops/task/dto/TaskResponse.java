package com.shiftops.task.dto;

import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.user.entity.User;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record TaskResponse(
        UUID id,
        UUID shiftAssignmentId,
        UUID shiftId,
        String shiftName,
        UUID branchId,
        String branchName,
        UUID userId,
        String userName,
        String userEmail,
        UUID templateItemId,
        String title,
        String description,
        TaskPriority priority,
        TaskStatus status,
        Instant dueTime,
        Instant completedAt,
        UUID completedById,
        String completedByName,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
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

    public UUID getId() {
        return id();
    }

    public UUID getShiftAssignmentId() {
        return shiftAssignmentId();
    }

    public UUID getShiftId() {
        return shiftId();
    }

    public String getShiftName() {
        return shiftName();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public UUID getUserId() {
        return userId();
    }

    public String getUserName() {
        return userName();
    }

    public String getUserEmail() {
        return userEmail();
    }

    public UUID getTemplateItemId() {
        return templateItemId();
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

    public TaskStatus getStatus() {
        return status();
    }

    public Instant getDueTime() {
        return dueTime();
    }

    public Instant getCompletedAt() {
        return completedAt();
    }

    public UUID getCompletedById() {
        return completedById();
    }

    public String getCompletedByName() {
        return completedByName();
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
