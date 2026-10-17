package com.shiftops.shift.entity;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ShiftStatus status = ShiftStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ShiftAssignment> assignments = new ArrayList<>();

    // =========================================================================
    // Domain Business Methods (Expressive Ubiquitous Language)
    // =========================================================================

    public boolean isDraft() {
        return status == ShiftStatus.DRAFT;
    }

    public boolean isPublished() {
        return status == ShiftStatus.PUBLISHED;
    }

    public boolean isCompleted() {
        return status == ShiftStatus.COMPLETED;
    }

    public boolean isCancelled() {
        return status == ShiftStatus.CANCELLED;
    }

    public void publish() {
        if (this.status == ShiftStatus.COMPLETED || this.status == ShiftStatus.CANCELLED) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + this.status + " to PUBLISHED");
        }
        this.status = ShiftStatus.PUBLISHED;
    }

    public void revertToDraft() {
        if (this.status != ShiftStatus.PUBLISHED) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + this.status + " to DRAFT");
        }
        this.status = ShiftStatus.DRAFT;
    }

    public void complete() {
        if (this.status != ShiftStatus.PUBLISHED) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + this.status + " to COMPLETED");
        }
        this.status = ShiftStatus.COMPLETED;
    }

    public void cancel() {
        if (this.status == ShiftStatus.COMPLETED || this.status == ShiftStatus.CANCELLED) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + this.status + " to CANCELLED");
        }
        this.status = ShiftStatus.CANCELLED;
    }

    public void transitionTo(ShiftStatus targetStatus) {
        if (this.status == targetStatus) {
            return;
        }

        boolean allowed = switch (this.status) {
            case DRAFT -> (targetStatus == ShiftStatus.PUBLISHED || targetStatus == ShiftStatus.CANCELLED);
            case PUBLISHED -> (targetStatus == ShiftStatus.DRAFT || targetStatus == ShiftStatus.COMPLETED || targetStatus == ShiftStatus.CANCELLED);
            case COMPLETED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new com.shiftops.common.exception.BusinessRuleException(
                    "INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + this.status + " to " + targetStatus);
        }

        switch (targetStatus) {
            case PUBLISHED -> publish();
            case DRAFT -> revertToDraft();
            case COMPLETED -> complete();
            case CANCELLED -> cancel();
        }
    }

    public void updateSchedule(Instant newStart, Instant newEnd) {
        if (isCompleted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_COMPLETED", "Completed shifts cannot be modified");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_CANCELLED", "Cancelled shifts cannot be modified");
        }
        if (isPublished()) {
            throw new com.shiftops.common.exception.BusinessRuleException("PUBLISHED_SHIFT_IMMUTABLE_TIMES",
                    "Cannot modify times of a published shift. Revert to DRAFT first.");
        }
        if (!newStart.isBefore(newEnd)) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_TIME_RANGE", "Start time must be before end time");
        }
        this.startTime = newStart;
        this.endTime = newEnd;
    }

    public void updateDetails(String newName, String newNotes) {
        if (isCompleted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_COMPLETED", "Completed shifts cannot be modified");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_CANCELLED", "Cancelled shifts cannot be modified");
        }
        if (newName != null) {
            this.name = newName.trim();
        }
        if (newNotes != null) {
            this.notes = newNotes.trim();
        }
    }

    public boolean isAssignedTo(java.util.UUID userId) {
        if (assignments == null || userId == null) {
            return false;
        }
        return assignments.stream().anyMatch(a -> a.getUser().getId().equals(userId));
    }

    public List<java.util.UUID> getAssignedStaffIds() {
        if (assignments == null) {
            return List.of();
        }
        return assignments.stream().map(a -> a.getUser().getId()).toList();
    }

    public void assignStaff(ShiftAssignment assignment) {
        if (isCompleted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_COMPLETED", "Cannot assign staff to a completed shift");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_CANCELLED", "Cannot assign staff to a cancelled shift");
        }
        this.assignments.add(assignment);
    }

    public void removeStaff(ShiftAssignment assignment) {
        if (isCompleted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_COMPLETED", "Cannot remove assignments from a completed shift");
        }
        this.assignments.remove(assignment);
    }
}
