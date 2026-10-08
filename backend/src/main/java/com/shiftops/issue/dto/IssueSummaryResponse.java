package com.shiftops.issue.dto;

import lombok.Builder;

@Builder
public record IssueSummaryResponse(
        long totalCount,
        long openCount,
        long assignedCount,
        long inProgressCount,
        long resolvedCount,
        long closedCount,
        long urgentCount,
        long highCount
) {
    public long getTotalCount() {
        return totalCount();
    }

    public long getOpenCount() {
        return openCount();
    }

    public long getAssignedCount() {
        return assignedCount();
    }

    public long getInProgressCount() {
        return inProgressCount();
    }

    public long getResolvedCount() {
        return resolvedCount();
    }

    public long getClosedCount() {
        return closedCount();
    }

    public long getUrgentCount() {
        return urgentCount();
    }

    public long getHighCount() {
        return highCount();
    }
}
