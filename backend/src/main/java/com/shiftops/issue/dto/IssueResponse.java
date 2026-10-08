package com.shiftops.issue.dto;

import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
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
public class IssueResponse {

    private UUID id;
    private UUID branchId;
    private String branchName;
    private UUID reportedById;
    private String reportedByName;
    private String reportedByEmail;
    private UUID shiftAssignmentId;
    private UUID taskId;
    private String title;
    private String description;
    private IssueCategory category;
    private IssuePriority priority;
    private IssueStatus status;
    private UUID assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    private Instant resolvedAt;
    private UUID resolvedById;
    private String resolvedByName;
    private Instant closedAt;
    private UUID closedById;
    private String closedByName;
    private int commentCount;
    private int attachmentCount;
    private List<IssueCommentResponse> comments;
    private List<IssueAttachmentResponse> attachments;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

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
}
