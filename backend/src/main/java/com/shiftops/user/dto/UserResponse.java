package com.shiftops.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        Role role,
        UUID primaryBranchId,
        String primaryBranchName,
        boolean active,
        boolean mustChangePassword,
        String temporaryPassword,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse fromEntity(User user) {
        return fromEntity(user, null);
    }

    public static UserResponse fromEntity(User user, String temporaryPassword) {
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
                .temporaryPassword(temporaryPassword)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public String getEmail() {
        return email();
    }

    public String getFullName() {
        return fullName();
    }

    public String getPhone() {
        return phone();
    }

    public Role getRole() {
        return role();
    }

    public UUID getPrimaryBranchId() {
        return primaryBranchId();
    }

    public String getPrimaryBranchName() {
        return primaryBranchName();
    }

    public boolean isActive() {
        return active();
    }

    public boolean isMustChangePassword() {
        return mustChangePassword();
    }

    public String getTemporaryPassword() {
        return temporaryPassword();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
