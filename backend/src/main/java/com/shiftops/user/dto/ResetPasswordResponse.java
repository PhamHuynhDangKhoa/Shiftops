package com.shiftops.user.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record ResetPasswordResponse(
        UUID userId,
        String email,
        String temporaryPassword,
        String message
) {
    public static ResetPasswordResponse of(UUID userId, String email, String temporaryPassword, String message) {
        return new ResetPasswordResponse(userId, email, temporaryPassword, message);
    }

    public static ResetPasswordResponse of(UUID userId, String email, String temporaryPassword) {
        return new ResetPasswordResponse(userId, email, temporaryPassword, "Temporary password generated. Staff must change password after login.");
    }
    public UUID getUserId() {
        return userId();
    }

    public String getEmail() {
        return email();
    }

    public String getTemporaryPassword() {
        return temporaryPassword();
    }

    public String getMessage() {
        return message();
    }
}
