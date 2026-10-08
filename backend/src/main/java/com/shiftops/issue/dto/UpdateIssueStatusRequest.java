package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateIssueStatusRequest(
        @NotNull(message = "Status is required")
        IssueStatus status,

        String comment
) {
    public IssueStatus getStatus() {
        return status();
    }

    public String getComment() {
        return comment();
    }
}
