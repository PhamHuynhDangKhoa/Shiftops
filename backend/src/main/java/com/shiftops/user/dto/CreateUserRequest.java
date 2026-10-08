package com.shiftops.user.dto;

import com.shiftops.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CreateUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @Size(min = 8, message = "Password must be at least 8 characters if provided")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        String phone,

        @NotNull(message = "Role is required")
        Role role,

        UUID primaryBranchId
) {
    public String getEmail() {
        return email();
    }

    public String getPassword() {
        return password();
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
}
