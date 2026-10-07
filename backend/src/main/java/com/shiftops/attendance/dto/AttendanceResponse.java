package com.shiftops.attendance.dto;

import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private UUID id;
    private UUID shiftAssignmentId;
    private UUID shiftId;
    private String shiftName;
    private UUID branchId;
    private String branchName;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Instant shiftStartTime;
    private Instant shiftEndTime;
    private Instant checkInAt;
    private Instant checkOutAt;
    private AttendanceStatus status;
    private boolean late;
    private boolean overnight;
    private String notes;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

    public static AttendanceResponse fromEntity(Attendance attendance) {
        ShiftAssignment sa = attendance.getShiftAssignment();
        Shift shift = sa.getShift();
        User user = sa.getUser();

        LocalDate startDate = shift.getStartTime().atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = shift.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
        boolean isOvernight = !startDate.equals(endDate);

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .shiftAssignmentId(sa.getId())
                .shiftId(shift.getId())
                .shiftName(shift.getName())
                .branchId(shift.getBranch().getId())
                .branchName(shift.getBranch().getName())
                .userId(user.getId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .shiftStartTime(shift.getStartTime())
                .shiftEndTime(shift.getEndTime())
                .checkInAt(attendance.getCheckInAt())
                .checkOutAt(attendance.getCheckOutAt())
                .status(attendance.getStatus())
                .late(attendance.isLate())
                .overnight(isOvernight)
                .notes(attendance.getNotes())
                .version(attendance.getVersion())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }
}
