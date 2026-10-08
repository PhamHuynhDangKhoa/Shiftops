package com.shiftops.handover.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.dto.*;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.service.ShiftHandoverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Shift Handover", description = "Shift handover management and operational debrief APIs")
public class ShiftHandoverController {

    private final ShiftHandoverService handoverService;

    @Operation(summary = "Create or retrieve draft handover for a shift")
    @PostMapping("/shifts/{shiftId}/handover")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> createOrGetDraftHandover(
            @PathVariable UUID shiftId,
            @Valid @RequestBody(required = false) CreateHandoverRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.createOrGetDraftHandover(shiftId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Draft handover ready"));
    }

    @Operation(summary = "Get handover details for a specific shift")
    @GetMapping("/shifts/{shiftId}/handover")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> getHandoverByShiftId(
            @PathVariable UUID shiftId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.getHandoverByShiftId(shiftId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get the latest submitted or acknowledged handover for a branch")
    @GetMapping("/branches/{branchId}/handovers/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> getLatestBranchHandover(
            @PathVariable UUID branchId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.getLatestBranchHandover(branchId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "List all handovers for a branch with optional status filter")
    @GetMapping("/branches/{branchId}/handovers")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<ShiftHandoverResponse>>> getBranchHandovers(
            @PathVariable UUID branchId,
            @RequestParam(required = false) HandoverStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ShiftHandoverResponse> responsePage = handoverService.getBranchHandovers(branchId, status, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(responsePage)));
    }

    @Operation(summary = "Update notes and items on a draft handover")
    @PutMapping("/handovers/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> updateDraftHandover(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHandoverRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.updateDraftHandover(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Handover draft updated successfully"));
    }

    @Operation(summary = "Submit a draft handover, finalizing outgoing shift debrief")
    @PatchMapping("/handovers/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> submitHandover(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.submitHandover(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Handover submitted successfully"));
    }

    @Operation(summary = "Acknowledge a submitted handover by incoming shift or manager")
    @PatchMapping("/handovers/{id}/acknowledge")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> acknowledgeHandover(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) AcknowledgeHandoverRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftHandoverResponse response = handoverService.acknowledgeHandover(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Handover acknowledged successfully"));
    }
}
