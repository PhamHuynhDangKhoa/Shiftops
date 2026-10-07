package com.shiftops.shift.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.dto.*;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @PostMapping("/branches/{branchId}/shifts")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ShiftResponse>> createShift(
            @PathVariable UUID branchId,
            @Valid @RequestBody CreateShiftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.createShift(branchId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Shift created successfully"));
    }

    @GetMapping("/branches/{branchId}/shifts")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getBranchShifts(
            @PathVariable UUID branchId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(required = false) ShiftStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ShiftResponse> responses = shiftService.getBranchShifts(branchId, startDate, endDate, status, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/shifts/my-shifts")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getMyShifts(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ShiftResponse> responses = shiftService.getMyShifts(startDate, endDate, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/shifts/{id}")
    public ResponseEntity<ApiResponse<ShiftResponse>> getShiftById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.getShiftById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/shifts/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ShiftResponse>> updateShift(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateShiftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.updateShift(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Shift updated successfully"));
    }

    @PatchMapping("/shifts/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ShiftResponse>> updateShiftStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateShiftStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.updateShiftStatus(id, request.getStatus(), principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Shift status updated successfully"));
    }

    @PostMapping("/shifts/{id}/assignments")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ShiftResponse>> assignStaff(
            @PathVariable UUID id,
            @Valid @RequestBody AssignStaffRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.assignStaff(id, request.getUserId(), principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff assigned to shift successfully"));
    }

    @DeleteMapping("/shifts/{id}/assignments/{userId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ShiftResponse>> removeStaffAssignment(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ShiftResponse response = shiftService.removeStaffAssignment(id, userId, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff removed from shift successfully"));
    }
}
