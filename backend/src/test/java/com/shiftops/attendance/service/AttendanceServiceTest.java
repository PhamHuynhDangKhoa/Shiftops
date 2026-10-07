package com.shiftops.attendance.service;

import com.shiftops.attendance.dto.AttendanceResponse;
import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.user.service.BranchAccessService;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @Mock
    private Clock clock;

    @InjectMocks
    private AttendanceService attendanceService;

    private Branch branch;
    private User staffUser;
    private User otherStaffUser;
    private User managerUser;
    private UserPrincipal staffPrincipal;
    private UserPrincipal otherStaffPrincipal;
    private UserPrincipal managerPrincipal;
    private Shift publishedShift;
    private ShiftAssignment assignment;

    @BeforeEach
    void setUp() {
        branch = Branch.builder()
                .name("Main Branch")
                .address("100 Main St")
                .timezone("UTC")
                .isActive(true)
                .build();
        branch.setId(UUID.randomUUID());

        staffUser = User.builder()
                .email("alice@shiftops.com")
                .fullName("Alice Staff")
                .role(Role.STAFF)
                .primaryBranch(branch)
                .isActive(true)
                .build();
        staffUser.setId(UUID.randomUUID());

        otherStaffUser = User.builder()
                .email("bob@shiftops.com")
                .fullName("Bob Staff")
                .role(Role.STAFF)
                .primaryBranch(branch)
                .isActive(true)
                .build();
        otherStaffUser.setId(UUID.randomUUID());

        managerUser = User.builder()
                .email("manager@shiftops.com")
                .fullName("Manager Charlie")
                .role(Role.MANAGER)
                .primaryBranch(branch)
                .isActive(true)
                .build();
        managerUser.setId(UUID.randomUUID());

        staffPrincipal = UserPrincipal.create(staffUser);
        otherStaffPrincipal = UserPrincipal.create(otherStaffUser);
        managerPrincipal = UserPrincipal.create(managerUser);

        publishedShift = Shift.builder()
                .branch(branch)
                .name("Morning Shift")
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.PUBLISHED)
                .build();
        publishedShift.setId(UUID.randomUUID());

        assignment = ShiftAssignment.builder()
                .shift(publishedShift)
                .user(staffUser)
                .assignedBy(managerUser)
                .assignedAt(Instant.now())
                .build();
        assignment.setId(UUID.randomUUID());
    }

    // 1. Check-In: On-time check-in (at exact start)
    @Test
    void checkIn_NormalOnTime_MarkedPresent() {
        Instant checkInTime = Instant.parse("2026-10-10T08:00:00Z");
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> {
            Attendance a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttendanceResponse response = attendanceService.checkIn(assignment.getId(), staffPrincipal);

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(response.isLate()).isFalse();
        assertThat(response.getCheckInAt()).isEqualTo(checkInTime);
    }

    // 2. Check-In: Early arrival inside 15-minute window
    @Test
    void checkIn_EarlyWithin15Minutes_MarkedPresent() {
        Instant checkInTime = Instant.parse("2026-10-10T07:50:00Z"); // 10 minutes early
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> {
            Attendance a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttendanceResponse response = attendanceService.checkIn(assignment.getId(), staffPrincipal);

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(response.isLate()).isFalse();
        assertThat(response.getCheckInAt()).isEqualTo(checkInTime);
    }

    // 3. Check-In: Too early (more than 15 minutes before shift start)
    @Test
    void checkIn_TooEarly_ThrowsBusinessRuleException() {
        Instant checkInTime = Instant.parse("2026-10-10T07:44:00Z"); // 16 minutes early
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Check-in is only allowed starting 15 minutes before shift start");
    }

    // 4. Check-In: Late (after start time)
    @Test
    void checkIn_LateAfterStart_MarkedLate() {
        Instant checkInTime = Instant.parse("2026-10-10T08:05:00Z"); // 5 minutes late
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> {
            Attendance a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttendanceResponse response = attendanceService.checkIn(assignment.getId(), staffPrincipal);

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.LATE);
        assertThat(response.isLate()).isTrue();
        assertThat(response.getCheckInAt()).isEqualTo(checkInTime);
    }

    // 5. Check-In: After shift ended
    @Test
    void checkIn_AfterShiftEnded_ThrowsBusinessRuleException() {
        Instant checkInTime = Instant.parse("2026-10-10T16:05:00Z"); // 5 minutes after shift end
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Shift has already ended");
    }

    // 6. Check-In: Duplicate check-in rejected
    @Test
    void checkIn_Duplicate_ThrowsConflictException() {
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(true);

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), staffPrincipal))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Already checked in");
    }

    // 7. Check-In: Cannot check in for another staff member
    @Test
    void checkIn_AnotherStaffAssignment_ThrowsAccessDeniedException() {
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), otherStaffPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("only check in for your own shift assignment");
    }

    // 8. Check-In: Manager cannot check in
    @Test
    void checkIn_ManagerCaller_ThrowsAccessDeniedException() {
        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), managerPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only staff members can check in");
    }

    // 9. Check-In: Unpublished draft shift rejected
    @Test
    void checkIn_DraftShift_ThrowsBusinessRuleException() {
        publishedShift.setStatus(ShiftStatus.DRAFT);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot check in for an unpublished shift");
    }

    // 10. Check-In: Cancelled shift rejected
    @Test
    void checkIn_CancelledShift_ThrowsBusinessRuleException() {
        publishedShift.setStatus(ShiftStatus.CANCELLED);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));

        assertThatThrownBy(() -> attendanceService.checkIn(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot check in for a cancelled shift");
    }

    // 11. Check-In: Overnight Shift crossing midnight
    @Test
    void checkIn_OvernightShift_Success() {
        publishedShift.setStartTime(Instant.parse("2026-10-10T22:00:00Z"));
        publishedShift.setEndTime(Instant.parse("2026-10-11T06:00:00Z"));

        Instant checkInTime = Instant.parse("2026-10-10T21:50:00Z"); // 10 min before 22:00
        when(clock.instant()).thenReturn(checkInTime);
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> {
            Attendance a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttendanceResponse response = attendanceService.checkIn(assignment.getId(), staffPrincipal);

        assertThat(response.isOvernight()).isTrue();
        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(response.isLate()).isFalse();
    }

    // 12. Check-Out: After check-in -> COMPLETED
    @Test
    void checkOut_AfterCheckIn_MarkedCompleted() {
        Instant checkInTime = Instant.parse("2026-10-10T08:00:00Z");
        Instant checkOutTime = Instant.parse("2026-10-10T16:00:00Z");

        Attendance existing = Attendance.builder()
                .shiftAssignment(assignment)
                .checkInAt(checkInTime)
                .status(AttendanceStatus.PRESENT)
                .isLate(false)
                .build();
        existing.setId(UUID.randomUUID());

        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.findByShiftAssignmentId(assignment.getId())).thenReturn(Optional.of(existing));
        when(clock.instant()).thenReturn(checkOutTime);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> i.getArgument(0));

        AttendanceResponse response = attendanceService.checkOut(assignment.getId(), staffPrincipal);

        assertThat(response.getStatus()).isEqualTo(AttendanceStatus.COMPLETED);
        assertThat(response.getCheckOutAt()).isEqualTo(checkOutTime);
    }

    // 13. Check-Out: Without check-in rejected
    @Test
    void checkOut_WithoutCheckIn_ThrowsBusinessRuleException() {
        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.findByShiftAssignmentId(assignment.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.checkOut(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot check out without checking in first");
    }

    // 14. Check-Out: Duplicate check-out rejected
    @Test
    void checkOut_Duplicate_ThrowsBusinessRuleException() {
        Attendance completed = Attendance.builder()
                .shiftAssignment(assignment)
                .checkInAt(Instant.parse("2026-10-10T08:00:00Z"))
                .checkOutAt(Instant.parse("2026-10-10T16:00:00Z"))
                .status(AttendanceStatus.COMPLETED)
                .build();

        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.findByShiftAssignmentId(assignment.getId())).thenReturn(Optional.of(completed));

        assertThatThrownBy(() -> attendanceService.checkOut(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Attendance is already completed");
    }

    // 15. Check-Out: Absent record check-out rejected
    @Test
    void checkOut_AbsentRecord_ThrowsBusinessRuleException() {
        Attendance absent = Attendance.builder()
                .shiftAssignment(assignment)
                .status(AttendanceStatus.ABSENT)
                .build();

        when(shiftAssignmentRepository.findByIdWithDetails(assignment.getId())).thenReturn(Optional.of(assignment));
        when(attendanceRepository.findByShiftAssignmentId(assignment.getId())).thenReturn(Optional.of(absent));

        assertThatThrownBy(() -> attendanceService.checkOut(assignment.getId(), staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot check out from an absent attendance record");
    }

    // 16. Mark Absent: Unattended past shifts marked as ABSENT
    @Test
    void markAbsentShifts_DetectsUnattendedAssignments_Success() {
        Instant now = Instant.parse("2026-10-10T17:00:00Z"); // 1 hr past shift end

        when(shiftAssignmentRepository.findUnattendedAssignmentsPastCutoff(now)).thenReturn(List.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(false);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> i.getArgument(0));

        int markedCount = attendanceService.markAbsentShifts(now);

        assertThat(markedCount).isEqualTo(1);
        verify(attendanceRepository).save(argThat(a ->
                a.getStatus() == AttendanceStatus.ABSENT &&
                a.getCheckInAt() == null &&
                a.getShiftAssignment().equals(assignment)
        ));
    }

    // 17. Mark Absent: Idempotent when attendance already exists
    @Test
    void markAbsentShifts_IdempotentOnSubsequentRuns() {
        Instant now = Instant.parse("2026-10-10T17:00:00Z");

        when(shiftAssignmentRepository.findUnattendedAssignmentsPastCutoff(now)).thenReturn(List.of(assignment));
        when(attendanceRepository.existsByShiftAssignmentId(assignment.getId())).thenReturn(true);

        int markedCount = attendanceService.markAbsentShifts(now);

        assertThat(markedCount).isEqualTo(0);
        verify(attendanceRepository, never()).save(any(Attendance.class));
    }
}
