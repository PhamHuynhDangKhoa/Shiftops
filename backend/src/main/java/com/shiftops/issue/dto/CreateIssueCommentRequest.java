package com.shiftops.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record CreateIssueCommentRequest(
        @NotBlank(message = "Comment message cannot be blank")
        @Size(max = 1000, message = "Comment message cannot exceed 1000 characters")
        String message,

        Boolean internal
) {
    public CreateIssueCommentRequest {
        if (internal == null) {
            internal = false;
        }
    }

    public String getMessage() {
        return message();
    }

    public Boolean getInternal() {
        return internal();
    }
}
