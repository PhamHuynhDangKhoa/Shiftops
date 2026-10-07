package com.shiftops.user.dto;

import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private UUID primaryBranchId;
    private String primaryBranchName;
    private boolean active;
    private boolean mustChangePassword;
    private Instant createdAt;
    private Instant updatedAt;

    public static UserResponse fromEntity(User user) {
        UUID branchId = user.getPrimaryBranch() != null ? user.getPrimaryBranch().getId() : null;
        String branchName = user.getPrimaryBranch() != null ? user.getPrimaryBranch().getName() : null;

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .primaryBranchId(branchId)
                .primaryBranchName(branchName)
                .active(user.isActive())
                .mustChangePassword(user.isMustChangePassword())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
