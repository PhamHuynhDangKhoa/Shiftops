package com.shiftops.branch.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record BranchSummaryResponse(
        UUID branchId,
        String branchName,
        long totalStaff,
        long activeStaff,
        long managerCount
) {
    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public long getTotalStaff() {
        return totalStaff();
    }

    public long getActiveStaff() {
        return activeStaff();
    }

    public long getManagerCount() {
        return managerCount();
    }
}
