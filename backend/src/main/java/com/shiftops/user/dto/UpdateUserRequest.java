package com.shiftops.user.dto;

import com.shiftops.user.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record UpdateUserRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        String phone,

        Role role,

        UUID primaryBranchId
) {
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
}
