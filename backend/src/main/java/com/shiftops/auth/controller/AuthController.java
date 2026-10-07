package com.shiftops.auth.controller;

import com.shiftops.auth.dto.AuthResponse;
import com.shiftops.auth.dto.LoginRequest;
import com.shiftops.auth.service.AuthService;
import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.ChangePasswordRequest;
import com.shiftops.user.dto.UpdateProfileRequest;
import com.shiftops.user.dto.UserResponse;
import com.shiftops.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(authService.getMe(principal)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<UserResponse>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Password changed successfully"));
    }
}
