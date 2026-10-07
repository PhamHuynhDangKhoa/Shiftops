package com.shiftops.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordResponse {
    private UUID userId;
    private String email;
    private String temporaryPassword;
    private String message;
}
