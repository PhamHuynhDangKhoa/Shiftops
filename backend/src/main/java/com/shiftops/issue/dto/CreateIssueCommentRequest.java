package com.shiftops.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIssueCommentRequest {

    @NotBlank(message = "Comment message cannot be blank")
    @Size(max = 1000, message = "Comment message cannot exceed 1000 characters")
    private String message;

    @Builder.Default
    private Boolean internal = false;
}
