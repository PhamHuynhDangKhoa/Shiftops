package com.shiftops.task.entity;

import com.shiftops.common.entity.BaseEntity;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "tasks",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_task_assignment_template_item", columnNames = {"shift_assignment_id", "template_item_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_assignment_id", nullable = false)
    private ShiftAssignment shiftAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
    private TaskTemplateItem templateItem;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskPriority priority = TaskPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Column(name = "due_time")
    private Instant dueTime;

    @Column(name = "completed_at")
    private Instant completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_id")
    private User completedBy;

    // =========================================================================
    // Domain Business Methods (Expressive Ubiquitous Language)
    // =========================================================================

    public boolean isTodo() {
        return status == TaskStatus.TODO;
    }

    public boolean isInProgress() {
        return status == TaskStatus.IN_PROGRESS;
    }

    public boolean isCompleted() {
        return status == TaskStatus.COMPLETED;
    }

    public boolean isCancelled() {
        return status == TaskStatus.CANCELLED;
    }

    public void cancel() {
        if (!isCompleted()) {
            this.status = TaskStatus.CANCELLED;
        }
    }

    public void transitionTo(TaskStatus targetStatus, User completedByUser, Instant now, boolean isStaff) {
        if (this.status == targetStatus) {
            return;
        }

        if (isCompleted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("TASK_ALREADY_COMPLETED", "Completed task cannot be modified");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("TASK_CANCELLED", "Cancelled task cannot be modified");
        }

        if (isStaff && targetStatus == TaskStatus.CANCELLED) {
            throw new org.springframework.security.access.AccessDeniedException("Staff members cannot cancel tasks");
        }

        boolean valid = switch (this.status) {
            case TODO -> (targetStatus == TaskStatus.IN_PROGRESS || targetStatus == TaskStatus.COMPLETED || targetStatus == TaskStatus.CANCELLED);
            case IN_PROGRESS -> (targetStatus == TaskStatus.COMPLETED || targetStatus == TaskStatus.CANCELLED || targetStatus == TaskStatus.TODO);
            default -> false;
        };

        if (!valid) {
            throw new com.shiftops.common.exception.BusinessRuleException(
                    "INVALID_TASK_TRANSITION",
                    "Cannot transition task from " + this.status + " to " + targetStatus);
        }

        this.status = targetStatus;

        if (targetStatus == TaskStatus.COMPLETED) {
            this.completedAt = now;
            this.completedBy = completedByUser;
        } else {
            this.completedAt = null;
            this.completedBy = null;
        }
    }
}
