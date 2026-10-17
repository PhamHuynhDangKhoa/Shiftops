package com.shiftops.attendance.entity;

import com.shiftops.common.entity.BaseEntity;
import com.shiftops.shift.entity.ShiftAssignment;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "attendance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_assignment_id", nullable = false, unique = true)
    private ShiftAssignment shiftAssignment;

    @Column(name = "check_in_at")
    private Instant checkInAt;

    @Column(name = "check_out_at")
    private Instant checkOutAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttendanceStatus status;

    @Column(name = "is_late", nullable = false)
    @Builder.Default
    private boolean isLate = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // =========================================================================
    // Domain Business Methods (Expressive Ubiquitous Language)
    // =========================================================================

    public static Attendance recordCheckIn(ShiftAssignment assignment, Instant checkInTime, Instant shiftStartTime) {
        boolean isLate = checkInTime.isAfter(shiftStartTime);
        AttendanceStatus status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        return Attendance.builder()
                .shiftAssignment(assignment)
                .checkInAt(checkInTime)
                .status(status)
                .isLate(isLate)
                .build();
    }

    public static Attendance recordAbsence(ShiftAssignment assignment, String notes) {
        return Attendance.builder()
                .shiftAssignment(assignment)
                .status(AttendanceStatus.ABSENT)
                .isLate(false)
                .notes(notes)
                .build();
    }

    public void checkOut(Instant checkOutTime) {
        if (this.status == AttendanceStatus.COMPLETED) {
            throw new com.shiftops.common.exception.BusinessRuleException("ATTENDANCE_ALREADY_COMPLETED", "Attendance is already completed");
        }
        if (this.status == AttendanceStatus.ABSENT) {
            throw new com.shiftops.common.exception.BusinessRuleException("CANNOT_CHECKOUT_ABSENT", "Cannot check out from an absent attendance record");
        }

        Instant effectiveCheckOut = checkOutTime.isBefore(this.checkInAt) ? this.checkInAt : checkOutTime;
        this.checkOutAt = effectiveCheckOut;
        this.status = AttendanceStatus.COMPLETED;
    }
}
