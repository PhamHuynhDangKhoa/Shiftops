package com.shiftops.issue.dto;

import com.shiftops.common.security.UserPrincipal;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import lombok.Builder;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Builder
public record BranchIssuesQuery(
        UUID branchId,
        IssueStatus status,
        IssuePriority priority,
        IssueCategory category,
        UUID assignedToId,
        Pageable pageable,
        UserPrincipal principal
) {}
