package com.shiftops.shift.dto;

import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record ShiftResponse(
        UUID id,
        UUID branchId,
        String branchName,
        String name,
        Instant startTime,
        Instant endTime,
        boolean overnight,
        ShiftStatus status,
        String notes,
        List<ShiftAssignmentResponse> assignments,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {
    public static ShiftResponse fromEntity(Shift shift) {
        LocalDate startDate = shift.getStartTime().atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = shift.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
        boolean isOvernight = !startDate.equals(endDate);

        List<ShiftAssignmentResponse> assignmentResponses = shift.getAssignments() != null
                ? shift.getAssignments().stream()
                .map(ShiftAssignmentResponse::fromEntity)
                .toList()
                : Collections.emptyList();

        return ShiftResponse.builder()
                .id(shift.getId())
                .branchId(shift.getBranch().getId())
                .branchName(shift.getBranch().getName())
                .name(shift.getName())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .overnight(isOvernight)
                .status(shift.getStatus())
                .notes(shift.getNotes())
                .assignments(assignmentResponses)
                .version(shift.getVersion())
                .createdAt(shift.getCreatedAt())
                .updatedAt(shift.getUpdatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public String getName() {
        return name();
    }

    public Instant getStartTime() {
        return startTime();
    }

    public Instant getEndTime() {
        return endTime();
    }

    public boolean isOvernight() {
        return overnight();
    }

    public ShiftStatus getStatus() {
        return status();
    }

    public String getNotes() {
        return notes();
    }

    public List<ShiftAssignmentResponse> getAssignments() {
        return assignments();
    }

    public Long getVersion() {
        return version();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
