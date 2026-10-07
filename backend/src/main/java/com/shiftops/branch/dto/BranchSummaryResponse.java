package com.shiftops.branch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchSummaryResponse {
    private UUID branchId;
    private String branchName;
    private long totalStaff;
    private long activeStaff;
    private long managerCount;
}
