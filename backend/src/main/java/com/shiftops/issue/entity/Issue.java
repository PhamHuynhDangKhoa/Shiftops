package com.shiftops.issue.entity;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.entity.BaseEntity;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.task.entity.Task;
import com.shiftops.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Issue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_assignment_id")
    private ShiftAssignment shiftAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IssueCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IssuePriority priority = IssuePriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    @Column(name = "closed_at")
    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by_id")
    private User closedBy;

    @Builder.Default
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<IssueComment> comments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<IssueAttachment> attachments = new ArrayList<>();

    public void addComment(IssueComment comment) {
        comments.add(comment);
        comment.setIssue(this);
    }

    public void addAttachment(IssueAttachment attachment) {
        attachments.add(attachment);
        attachment.setIssue(this);
    }

    // =========================================================================
    // Domain Business Methods (Expressive Ubiquitous Language)
    // =========================================================================

    public boolean isOpen() {
        return status == IssueStatus.OPEN;
    }

    public boolean isAssigned() {
        return status == IssueStatus.ASSIGNED;
    }

    public boolean isInProgress() {
        return status == IssueStatus.IN_PROGRESS;
    }

    public boolean isResolved() {
        return status == IssueStatus.RESOLVED;
    }

    public boolean isClosed() {
        return status == IssueStatus.CLOSED;
    }

    public boolean isCancelled() {
        return status == IssueStatus.CANCELLED;
    }

    public void assignStaff(User targetStaff, User actor) {
        if (isClosed()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CLOSED", "Cannot reassign a closed issue");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CANCELLED", "Cannot reassign a cancelled issue");
        }

        this.assignedTo = targetStaff;
        if (this.status == IssueStatus.OPEN) {
            this.status = IssueStatus.ASSIGNED;
        }

        addComment(IssueComment.builder()
                .issue(this)
                .author(actor)
                .message("Assigned issue to " + targetStaff.getFullName())
                .isInternal(false)
                .build());
    }

    public void unassignStaff(User actor) {
        if (isClosed()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CLOSED", "Cannot reassign a closed issue");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CANCELLED", "Cannot reassign a cancelled issue");
        }

        this.assignedTo = null;
        if (this.status == IssueStatus.ASSIGNED) {
            this.status = IssueStatus.OPEN;
        }

        addComment(IssueComment.builder()
                .issue(this)
                .author(actor)
                .message("Unassigned issue")
                .isInternal(false)
                .build());
    }

    public void transitionTo(IssueStatus targetStatus, User actor, String optionalComment, Instant now, boolean isStaff) {
        if (this.status == targetStatus) {
            return;
        }

        if (isClosed()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CLOSED", "Closed issue cannot be modified");
        }
        if (isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("ISSUE_CANCELLED", "Cancelled issue cannot be modified");
        }

        if (isStaff) {
            if (this.assignedTo == null || (actor != null && !this.assignedTo.getId().equals(actor.getId()))) {
                throw new org.springframework.security.access.AccessDeniedException("Staff can only update issues assigned to them");
            }
            if (targetStatus == IssueStatus.CLOSED || targetStatus == IssueStatus.CANCELLED) {
                throw new org.springframework.security.access.AccessDeniedException("Only managers can close or cancel issues");
            }
        }

        boolean valid = switch (this.status) {
            case OPEN -> (targetStatus == IssueStatus.ASSIGNED || targetStatus == IssueStatus.IN_PROGRESS || targetStatus == IssueStatus.CANCELLED);
            case ASSIGNED -> (targetStatus == IssueStatus.IN_PROGRESS || targetStatus == IssueStatus.CANCELLED || targetStatus == IssueStatus.OPEN);
            case IN_PROGRESS -> (targetStatus == IssueStatus.RESOLVED || targetStatus == IssueStatus.ASSIGNED || targetStatus == IssueStatus.CANCELLED);
            case RESOLVED -> (!isStaff && (targetStatus == IssueStatus.CLOSED || targetStatus == IssueStatus.IN_PROGRESS));
            default -> false;
        };

        if (!valid) {
            throw new com.shiftops.common.exception.BusinessRuleException(
                    "INVALID_STATE_TRANSITION",
                    "Cannot transition issue from " + this.status + " to " + targetStatus);
        }

        IssueStatus previousStatus = this.status;
        this.status = targetStatus;

        if (targetStatus == IssueStatus.RESOLVED) {
            this.resolvedAt = now;
            this.resolvedBy = actor;
        } else if (targetStatus == IssueStatus.CLOSED) {
            this.closedAt = now;
            this.closedBy = actor;
        } else if (previousStatus == IssueStatus.RESOLVED && targetStatus == IssueStatus.IN_PROGRESS) {
            this.resolvedAt = null;
            this.resolvedBy = null;
        }

        if (optionalComment != null && !optionalComment.isBlank()) {
            addComment(IssueComment.builder()
                    .issue(this)
                    .author(actor)
                    .message(optionalComment.trim())
                    .isInternal(false)
                    .build());
        }
    }
}
