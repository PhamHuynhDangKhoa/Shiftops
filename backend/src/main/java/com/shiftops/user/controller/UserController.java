package com.shiftops.user.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.*;
import com.shiftops.user.entity.Role;
import com.shiftops.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.createUser(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "fullName", direction = Sort.Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        PagedResponse<UserResponse> responses = userService.getUsers(branchId, role, active, search, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.getUserById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.updateUser(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "User updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.updateUserStatus(id, request.getActive(), principal);
        return ResponseEntity.ok(ApiResponse.success(response, "User status updated successfully"));
    }

    @PostMapping("/{id}/transfer-branch")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> transferBranch(
            @PathVariable UUID id,
            @Valid @RequestBody TransferBranchRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.transferBranch(id, request.getTargetBranchId(), principal);
        return ResponseEntity.ok(ApiResponse.success(response, "User transferred successfully"));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ResetPasswordResponse response = userService.resetPassword(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Password reset successfully"));
    }
}
