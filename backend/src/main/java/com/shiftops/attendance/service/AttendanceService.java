package com.shiftops.attendance.service;

import com.shiftops.attendance.dto.AttendanceResponse;
import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.user.service.BranchAccessService;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.shiftops.attendance.event.StaffCheckedInEvent;
import com.shiftops.attendance.event.StaffCheckedOutEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final BranchAccessService branchAccessService;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public static final Duration EARLY_ARRIVAL_WINDOW = Duration.ofMinutes(15);

    @Transactional
    public AttendanceResponse checkIn(UUID shiftAssignmentId, UserPrincipal principal) {
        if (!principal.isStaff()) {
            throw new AccessDeniedException("Only staff members can check in");
        }

        ShiftAssignment assignment = shiftAssignmentRepository.findByIdWithDetails(shiftAssignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", shiftAssignmentId));

        // Self-service validation: staff can only check in for their own assignment
        if (!assignment.getUser().getId().equals(principal.getId())) {
            throw new AccessDeniedException("You can only check in for your own shift assignment");
        }

        // Active account check
        if (!assignment.getUser().isActive()) {
            throw new BusinessRuleException("USER_INACTIVE", "Cannot check in for an inactive staff account");
        }

        Shift shift = assignment.getShift();

        // Active branch check
        if (!shift.getBranch().isActive()) {
            throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot check in for an inactive branch");
        }

        // Shift status check
        if (shift.getStatus() == ShiftStatus.DRAFT) {
            throw new BusinessRuleException("SHIFT_NOT_PUBLISHED", "Cannot check in for an unpublished shift");
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot check in for a cancelled shift");
        }
        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Cannot check in for a completed shift");
        }

        // Duplicate check-in check
        if (attendanceRepository.existsByShiftAssignmentId(shiftAssignmentId)) {
            throw new ConflictException("Already checked in for this shift assignment");
        }

        Instant now = clock.instant();

        // Early arrival limit (at most 15 minutes before shift start)
        Instant earliestCheckIn = shift.getStartTime().minus(EARLY_ARRIVAL_WINDOW);
        if (now.isBefore(earliestCheckIn)) {
            throw new BusinessRuleException(
                    "EARLY_CHECKIN_PROHIBITED",
                    "Check-in is only allowed starting 15 minutes before shift start");
        }

        // Shift ended check
        if (now.isAfter(shift.getEndTime())) {
            throw new BusinessRuleException(
                    "SHIFT_ALREADY_ENDED",
                    "Shift has already ended; check-in is no longer allowed");
        }

        Attendance attendance = Attendance.recordCheckIn(assignment, now, shift.getStartTime());
        Attendance saved = attendanceRepository.save(attendance);
        log.info("Staff {} checked in to assignment {}: status={}, late={}",
                principal.getUsername(), shiftAssignmentId, saved.getStatus(), saved.isLate());

        eventPublisher.publishEvent(new StaffCheckedInEvent(
                saved.getId(),
                shiftAssignmentId,
                shift.getId(),
                shift.getBranch().getId(),
                assignment.getUser().getId(),
                assignment.getUser().getFullName(),
                saved.getCheckInAt(),
                saved.isLate()
        ));

        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(UUID shiftAssignmentId, UserPrincipal principal) {
        if (!principal.isStaff()) {
            throw new AccessDeniedException("Only staff members can check out");
        }

        ShiftAssignment assignment = shiftAssignmentRepository.findByIdWithDetails(shiftAssignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", shiftAssignmentId));

        if (!assignment.getUser().getId().equals(principal.getId())) {
            throw new AccessDeniedException("You can only check out for your own shift assignment");
        }

        Attendance attendance = attendanceRepository.findByShiftAssignmentId(shiftAssignmentId)
                .orElseThrow(() -> new BusinessRuleException(
                        "CHECKOUT_WITHOUT_CHECKIN",
                        "Cannot check out without checking in first"));

        attendance.checkOut(clock.instant());

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Staff {} checked out from assignment {}: checkIn={}, checkOut={}",
                principal.getUsername(), shiftAssignmentId, saved.getCheckInAt(), saved.getCheckOutAt());

        eventPublisher.publishEvent(new StaffCheckedOutEvent(
                saved.getId(),
                shiftAssignmentId,
                assignment.getShift().getId(),
                assignment.getShift().getBranch().getId(),
                assignment.getUser().getId(),
                assignment.getUser().getFullName(),
                saved.getCheckOutAt()
        ));

        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance(UserPrincipal principal, Instant startDate, Instant endDate) {
        Instant start = startDate != null ? startDate : clock.instant().minus(Duration.ofDays(30));
        Instant end = endDate != null ? endDate : clock.instant().plus(Duration.ofDays(30));

        return attendanceRepository.findByUserIdAndWindow(principal.getId(), start, end)
                .stream()
                .map(AttendanceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getBranchAttendance(
            UUID branchId,
            Instant startDate,
            Instant endDate,
            AttendanceStatus status,
            UserPrincipal principal) {

        branchAccessService.validateBranchAccess(principal, branchId);

        Instant start = startDate != null ? startDate : clock.instant().minus(Duration.ofDays(30));
        Instant end = endDate != null ? endDate : clock.instant().plus(Duration.ofDays(30));

        return attendanceRepository.findByBranchAndWindow(branchId, start, end, status)
                .stream()
                .map(AttendanceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceById(UUID id, UserPrincipal principal) {
        Attendance attendance = attendanceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", id));

        if (principal.isStaff()) {
            if (!attendance.getShiftAssignment().getUser().getId().equals(principal.getId())) {
                throw new AccessDeniedException("Cannot access another user's attendance record");
            }
        } else {
            branchAccessService.validateBranchAccess(principal, attendance.getShiftAssignment().getShift().getBranch().getId());
        }

        return AttendanceResponse.fromEntity(attendance);
    }

    @Transactional
    public int markAbsentShifts(Instant cutoff) {
        List<ShiftAssignment> unattended = shiftAssignmentRepository.findUnattendedAssignmentsPastCutoff(cutoff);
        int markedCount = 0;

        for (ShiftAssignment sa : unattended) {
            if (!attendanceRepository.existsByShiftAssignmentId(sa.getId())) {
                Attendance absent = Attendance.recordAbsence(sa, "Marked absent automatically by scheduler");
                attendanceRepository.save(absent);
                markedCount++;
                log.info("Marked shift assignment {} as ABSENT for user {}", sa.getId(), sa.getUser().getEmail());
            }
        }

        return markedCount;
    }
}
