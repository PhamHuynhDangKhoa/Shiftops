package com.shiftops.shift.dto;

import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.user.entity.Role;
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
public class ShiftAssignmentResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Role userRole;
    private UUID assignedById;
    private String assignedByName;
    private Instant assignedAt;

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
}
