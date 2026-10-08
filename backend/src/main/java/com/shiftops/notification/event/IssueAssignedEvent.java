package com.shiftops.notification.event;

import java.util.UUID;

public record IssueAssignedEvent(
        UUID issueId,
        UUID branchId,
        UUID assignedToUserId,
        String issueTitle
) {}
