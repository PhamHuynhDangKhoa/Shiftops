package com.shiftops.notification.event;

import com.shiftops.issue.entity.IssueStatus;

import java.util.UUID;

public record IssueStatusChangedEvent(
        UUID issueId,
        UUID branchId,
        UUID reporterUserId,
        UUID assigneeUserId,
        IssueStatus oldStatus,
        IssueStatus newStatus,
        String issueTitle
) {}
