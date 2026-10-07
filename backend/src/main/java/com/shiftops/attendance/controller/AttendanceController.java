package com.shiftops.attendance.controller;

import com.shiftops.attendance.dto.AttendanceResponse;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.attendance.service.AttendanceService;
import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
@Tag(name = "Attendance", description = "Attendance check-in, check-out, and monitoring APIs")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @Operation(summary = "Staff self check-in to assigned shift")
    @PostMapping("/attendance/{assignmentId}/check-in")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceResponse response = attendanceService.checkIn(assignmentId, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Checked in successfully"));
    }

    @Operation(summary = "Staff self check-out from assigned shift")
    @PostMapping("/attendance/{assignmentId}/check-out")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceResponse response = attendanceService.checkOut(assignmentId, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Checked out successfully"));
    }

    @Operation(summary = "View current staff user's attendance records")
    @GetMapping("/attendance/my")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AttendanceResponse> response = attendanceService.getMyAttendance(principal, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "View attendance record detail by ID")
    @GetMapping("/attendance/{id}")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getAttendanceById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceResponse response = attendanceService.getAttendanceById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "View attendance records for a branch (Manager/Owner)")
    @GetMapping("/branches/{branchId}/attendance")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getBranchAttendance(
            @PathVariable UUID branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) AttendanceStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AttendanceResponse> response = attendanceService.getBranchAttendance(branchId, startDate, endDate, status, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
