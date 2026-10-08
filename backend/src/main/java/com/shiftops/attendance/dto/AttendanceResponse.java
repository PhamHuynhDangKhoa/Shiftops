package com.shiftops.attendance.dto;

import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.user.entity.User;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Builder
public record AttendanceResponse(
        UUID id,
        UUID shiftAssignmentId,
        UUID shiftId,
        String shiftName,
        UUID branchId,
        String branchName,
        UUID userId,
        String userName,
        String userEmail,
        Instant shiftStartTime,
        Instant shiftEndTime,
        Instant checkInAt,
        Instant checkOutAt,
        AttendanceStatus status,
        boolean late,
        boolean overnight,
        String notes,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {
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

    public UUID getId() {
        return id();
    }

    public UUID getShiftAssignmentId() {
        return shiftAssignmentId();
    }

    public UUID getShiftId() {
        return shiftId();
    }

    public String getShiftName() {
        return shiftName();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
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

    public Instant getShiftStartTime() {
        return shiftStartTime();
    }

    public Instant getShiftEndTime() {
        return shiftEndTime();
    }

    public Instant getCheckInAt() {
        return checkInAt();
    }

    public Instant getCheckOutAt() {
        return checkOutAt();
    }

    public AttendanceStatus getStatus() {
        return status();
    }

    public boolean isLate() {
        return late();
    }

    public boolean isOvernight() {
        return overnight();
    }

    public String getNotes() {
        return notes();
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
