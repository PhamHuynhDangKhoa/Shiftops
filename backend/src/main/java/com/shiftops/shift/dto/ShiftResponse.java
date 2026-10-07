package com.shiftops.shift.dto;

import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponse {
    private UUID id;
    private UUID branchId;
    private String branchName;
    private String name;
    private Instant startTime;
    private Instant endTime;
    private boolean overnight;
    private ShiftStatus status;
    private String notes;
    private List<ShiftAssignmentResponse> assignments;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

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
}
