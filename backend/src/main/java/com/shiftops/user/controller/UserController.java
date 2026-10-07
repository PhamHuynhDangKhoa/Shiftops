package com.shiftops.user.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.CreateUserRequest;
import com.shiftops.user.dto.UpdateUserStatusRequest;
import com.shiftops.user.dto.UserResponse;
import com.shiftops.user.service.UserService;
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
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<UserResponse> responses = userService.getUsers(principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.getUserById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
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
}
