package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueComment;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record IssueCommentResponse(
        UUID id,
        UUID issueId,
        UUID authorId,
        String authorName,
        String authorRole,
        String message,
        boolean internal,
        Instant createdAt
) {
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

    public UUID getId() {
        return id();
    }

    public UUID getIssueId() {
        return issueId();
    }

    public UUID getAuthorId() {
        return authorId();
    }

    public String getAuthorName() {
        return authorName();
    }

    public String getAuthorRole() {
        return authorRole();
    }

    public String getMessage() {
        return message();
    }

    public boolean isInternal() {
        return internal();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }
}
