package com.shiftops.branch.dto;

import com.shiftops.branch.entity.Branch;
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
    public static BranchSummaryResponse from(Branch branch, long totalStaff, long activeStaff, long managerCount) {
        return new BranchSummaryResponse(
                branch.getId(),
                branch.getName(),
                totalStaff,
                activeStaff,
                managerCount
        );
    }

    public static BranchSummaryResponse from(UUID branchId, String branchName, long totalStaff, long activeStaff, long managerCount) {
        return new BranchSummaryResponse(
                branchId,
                branchName,
                totalStaff,
                activeStaff,
                managerCount
        );
    }
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
