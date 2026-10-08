package com.shiftops.issue.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AssignIssueRequest(
        UUID assignedToUserId
) {
    public UUID getAssignedToUserId() {
        return assignedToUserId();
    }
}
