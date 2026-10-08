package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateIssueRequest(
        UUID branchId,

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @NotNull(message = "Category is required")
        IssueCategory category,

        IssuePriority priority,

        UUID shiftAssignmentId,

        UUID taskId
) {
    public UUID getBranchId() {
        return branchId();
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

    public UUID getShiftAssignmentId() {
        return shiftAssignmentId();
    }

    public UUID getTaskId() {
        return taskId();
    }
}
