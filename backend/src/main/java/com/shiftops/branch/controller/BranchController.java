package com.shiftops.branch.controller;

import com.shiftops.branch.dto.BranchResponse;
import com.shiftops.branch.dto.BranchSummaryResponse;
import com.shiftops.branch.dto.CreateBranchRequest;
import com.shiftops.branch.dto.UpdateBranchRequest;
import com.shiftops.branch.dto.UpdateBranchStatusRequest;
import com.shiftops.branch.service.BranchService;
import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(
            @Valid @RequestBody CreateBranchRequest request) {
        BranchResponse response = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Branch created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAccessibleBranches(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<BranchResponse> responses = branchService.getAccessibleBranches(principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponse>> getBranchById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        BranchResponse response = branchService.getBranchById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranch(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBranchRequest request) {
        BranchResponse response = branchService.updateBranch(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Branch updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<BranchResponse>> updateBranchStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBranchStatusRequest request) {
        BranchResponse response = branchService.updateBranchStatus(id, request.getActive());
        return ResponseEntity.ok(ApiResponse.success(response, "Branch status updated successfully"));
    }

    @GetMapping("/{id}/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<BranchSummaryResponse>> getBranchSummary(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        BranchSummaryResponse response = branchService.getBranchSummary(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
