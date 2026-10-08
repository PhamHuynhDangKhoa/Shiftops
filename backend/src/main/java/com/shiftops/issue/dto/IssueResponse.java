package com.shiftops.issue.dto;

import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record IssueResponse(
        UUID id,
        UUID branchId,
        String branchName,
        UUID reportedById,
        String reportedByName,
        String reportedByEmail,
        UUID shiftAssignmentId,
        UUID taskId,
        String title,
        String description,
        IssueCategory category,
        IssuePriority priority,
        IssueStatus status,
        UUID assignedToId,
        String assignedToName,
        String assignedToEmail,
        Instant resolvedAt,
        UUID resolvedById,
        String resolvedByName,
        Instant closedAt,
        UUID closedById,
        String closedByName,
        int commentCount,
        int attachmentCount,
        List<IssueCommentResponse> comments,
        List<IssueAttachmentResponse> attachments,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {
    public static IssueResponse fromEntity(Issue issue) {
        return fromEntity(issue, true);
    }

    public static IssueResponse fromEntity(Issue issue, boolean includeDetails) {
        List<IssueCommentResponse> commentResponses = Collections.emptyList();
        List<IssueAttachmentResponse> attachmentResponses = Collections.emptyList();

        if (includeDetails) {
            if (issue.getComments() != null) {
                commentResponses = issue.getComments().stream()
                        .map(IssueCommentResponse::fromEntity)
                        .toList();
            }
            if (issue.getAttachments() != null) {
                attachmentResponses = issue.getAttachments().stream()
                        .map(IssueAttachmentResponse::fromEntity)
                        .toList();
            }
        }

        int commentCount = issue.getComments() != null ? issue.getComments().size() : 0;
        int attachmentCount = issue.getAttachments() != null ? issue.getAttachments().size() : 0;

        return IssueResponse.builder()
                .id(issue.getId())
                .branchId(issue.getBranch() != null ? issue.getBranch().getId() : null)
                .branchName(issue.getBranch() != null ? issue.getBranch().getName() : null)
                .reportedById(issue.getReportedBy() != null ? issue.getReportedBy().getId() : null)
                .reportedByName(issue.getReportedBy() != null ? issue.getReportedBy().getFullName() : null)
                .reportedByEmail(issue.getReportedBy() != null ? issue.getReportedBy().getEmail() : null)
                .shiftAssignmentId(issue.getShiftAssignment() != null ? issue.getShiftAssignment().getId() : null)
                .taskId(issue.getTask() != null ? issue.getTask().getId() : null)
                .title(issue.getTitle())
                .description(issue.getDescription())
                .category(issue.getCategory())
                .priority(issue.getPriority())
                .status(issue.getStatus())
                .assignedToId(issue.getAssignedTo() != null ? issue.getAssignedTo().getId() : null)
                .assignedToName(issue.getAssignedTo() != null ? issue.getAssignedTo().getFullName() : null)
                .assignedToEmail(issue.getAssignedTo() != null ? issue.getAssignedTo().getEmail() : null)
                .resolvedAt(issue.getResolvedAt())
                .resolvedById(issue.getResolvedBy() != null ? issue.getResolvedBy().getId() : null)
                .resolvedByName(issue.getResolvedBy() != null ? issue.getResolvedBy().getFullName() : null)
                .closedAt(issue.getClosedAt())
                .closedById(issue.getClosedBy() != null ? issue.getClosedBy().getId() : null)
                .closedByName(issue.getClosedBy() != null ? issue.getClosedBy().getFullName() : null)
                .commentCount(commentCount)
                .attachmentCount(attachmentCount)
                .comments(commentResponses)
                .attachments(attachmentResponses)
                .version(issue.getVersion())
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
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

    public UUID getReportedById() {
        return reportedById();
    }

    public String getReportedByName() {
        return reportedByName();
    }

    public String getReportedByEmail() {
        return reportedByEmail();
    }

    public UUID getShiftAssignmentId() {
        return shiftAssignmentId();
    }

    public UUID getTaskId() {
        return taskId();
    }

    public String getTitle() {
        return title();
    }

    public String getDescription() {
        return description();
    }

    public IssueCategory getCategory() {
        return category();
    }

    public IssuePriority getPriority() {
        return priority();
    }

    public IssueStatus getStatus() {
        return status();
    }

    public UUID getAssignedToId() {
        return assignedToId();
    }

    public String getAssignedToName() {
        return assignedToName();
    }

    public String getAssignedToEmail() {
        return assignedToEmail();
    }

    public Instant getResolvedAt() {
        return resolvedAt();
    }

    public UUID getResolvedById() {
        return resolvedById();
    }

    public String getResolvedByName() {
        return resolvedByName();
    }

    public Instant getClosedAt() {
        return closedAt();
    }

    public UUID getClosedById() {
        return closedById();
    }

    public String getClosedByName() {
        return closedByName();
    }

    public int getCommentCount() {
        return commentCount();
    }

    public int getAttachmentCount() {
        return attachmentCount();
    }

    public List<IssueCommentResponse> getComments() {
        return comments();
    }

    public List<IssueAttachmentResponse> getAttachments() {
        return attachments();
    }

    public Long getVersion() {
        return version();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
