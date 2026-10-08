package com.shiftops.handover.dto;

import lombok.Builder;

@Builder
public record HandoverDerivedSummary(
        int totalTasks,
        int completedTasks,
        int pendingTasks,
        int openBranchIssues,
        int staffAssignedCount
) {
    public int getTotalTasks() {
        return totalTasks();
    }

    public int getCompletedTasks() {
        return completedTasks();
    }

    public int getPendingTasks() {
        return pendingTasks();
    }

    public int getOpenBranchIssues() {
        return openBranchIssues();
    }

    public int getStaffAssignedCount() {
        return staffAssignedCount();
    }
}
