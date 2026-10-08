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
