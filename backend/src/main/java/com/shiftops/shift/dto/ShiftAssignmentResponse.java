package com.shiftops.shift.dto;

import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.user.entity.Role;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ShiftAssignmentResponse(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        Role userRole,
        UUID assignedById,
        String assignedByName,
        Instant assignedAt
) {
    public static ShiftAssignmentResponse fromEntity(ShiftAssignment assignment) {
        return ShiftAssignmentResponse.builder()
                .id(assignment.getId())
                .userId(assignment.getUser().getId())
                .userName(assignment.getUser().getFullName())
                .userEmail(assignment.getUser().getEmail())
                .userRole(assignment.getUser().getRole())
                .assignedById(assignment.getAssignedBy().getId())
                .assignedByName(assignment.getAssignedBy().getFullName())
                .assignedAt(assignment.getAssignedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getUserId() {
        return userId();
    }

    public String getUserName() {
        return userName();
    }

    public String getUserEmail() {
        return userEmail();
    }

    public Role getUserRole() {
        return userRole();
    }

    public UUID getAssignedById() {
        return assignedById();
    }

    public String getAssignedByName() {
        return assignedByName();
    }

    public Instant getAssignedAt() {
        return assignedAt();
    }
}
