package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueComment;
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
public class IssueCommentResponse {

    private UUID id;
    private UUID issueId;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private String message;
    private boolean internal;
    private Instant createdAt;

    public static IssueCommentResponse fromEntity(IssueComment comment) {
        return IssueCommentResponse.builder()
                .id(comment.getId())
                .issueId(comment.getIssue() != null ? comment.getIssue().getId() : null)
                .authorId(comment.getAuthor() != null ? comment.getAuthor().getId() : null)
                .authorName(comment.getAuthor() != null ? comment.getAuthor().getFullName() : null)
                .authorRole(comment.getAuthor() != null && comment.getAuthor().getRole() != null ? comment.getAuthor().getRole().name() : null)
                .message(comment.getMessage())
                .internal(comment.isInternal())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
