package com.shiftops.auth.dto;

import com.shiftops.user.dto.UserResponse;
import lombok.Builder;

@Builder
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UserResponse user
) {
    public AuthResponse {
        if (tokenType == null) {
            tokenType = "Bearer";
        }
    }

    public String getAccessToken() {
        return accessToken();
    }

    public String getTokenType() {
        return tokenType();
    }

    public long getExpiresInMs() {
        return expiresInMs();
    }

    public UserResponse getUser() {
        return user();
    }
}
