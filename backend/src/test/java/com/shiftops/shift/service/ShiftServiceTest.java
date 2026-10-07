package com.shiftops.shift.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.dto.*;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiftServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @InjectMocks
    private ShiftService shiftService;

    private Branch branchA;
    private Branch inactiveBranch;
    private User owner;
    private User managerA;
    private User staffA;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal managerAPrincipal;
    private UserPrincipal staffAPrincipal;

    @BeforeEach
    void setUp() {
        branchA = Branch.builder()
                .name("Branch Alpha")
                .timezone("UTC")
                .isActive(true)
                .build();
        branchA.setId(UUID.randomUUID());

        inactiveBranch = Branch.builder()
                .name("Branch Inactive")
                .timezone("UTC")
                .isActive(false)
                .build();
        inactiveBranch.setId(UUID.randomUUID());

        owner = User.builder()
                .email("owner@shiftops.com")
                .fullName("System Owner")
                .role(Role.OWNER)
                .isActive(true)
                .build();
        owner.setId(UUID.randomUUID());

        managerA = User.builder()
                .email("manager@shiftops.com")
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        managerA.setId(UUID.randomUUID());

        staffA = User.builder()
                .email("staff@shiftops.com")
                .fullName("Staff Alice")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        staffA.setId(UUID.randomUUID());

        ownerPrincipal = UserPrincipal.create(owner);
        managerAPrincipal = UserPrincipal.create(managerA);
        staffAPrincipal = UserPrincipal.create(staffA);
    }

    @Test
    void createShift_NormalShift_Success() {
        Instant start = Instant.parse("2026-10-07T09:00:00Z");
        Instant end = Instant.parse("2026-10-07T17:00:00Z");
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Morning Shift")
                .startTime(start)
                .endTime(end)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(shiftRepository.save(any(Shift.class))).thenAnswer(i -> {
            Shift s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        ShiftResponse response = shiftService.createShift(branchA.getId(), request, managerAPrincipal);

        verify(branchAccessService).validateBranchAccess(managerAPrincipal, branchA.getId());
        assertThat(response.getName()).isEqualTo("Morning Shift");
        assertThat(response.isOvernight()).isFalse();
        assertThat(response.getStatus()).isEqualTo(ShiftStatus.DRAFT);
    }

    @Test
    void createShift_OvernightShift_Success() {
        // 22:00 -> 06:00 next day
        Instant start = Instant.parse("2026-10-07T22:00:00Z");
        Instant end = Instant.parse("2026-10-08T06:00:00Z");
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Overnight Shift")
                .startTime(start)
                .endTime(end)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(shiftRepository.save(any(Shift.class))).thenAnswer(i -> {
            Shift s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        ShiftResponse response = shiftService.createShift(branchA.getId(), request, ownerPrincipal);

        assertThat(response.isOvernight()).isTrue();
        assertThat(response.getStartTime()).isEqualTo(start);
        assertThat(response.getEndTime()).isEqualTo(end);
    }

    @Test
    void createShift_InvalidTimeRange_ThrowsBusinessRuleException() {
        Instant start = Instant.parse("2026-10-07T17:00:00Z");
        Instant end = Instant.parse("2026-10-07T09:00:00Z"); // end before start
        CreateShiftRequest request = CreateShiftRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));

        assertThatThrownBy(() -> shiftService.createShift(branchA.getId(), request, managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Start time must be before end time");
    }

    @Test
    void createShift_InactiveBranch_ThrowsBusinessRuleException() {
        Instant start = Instant.parse("2026-10-07T09:00:00Z");
        Instant end = Instant.parse("2026-10-07T17:00:00Z");
        CreateShiftRequest request = CreateShiftRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();

        when(branchRepository.findById(inactiveBranch.getId())).thenReturn(Optional.of(inactiveBranch));

        assertThatThrownBy(() -> shiftService.createShift(inactiveBranch.getId(), request, ownerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive branch");
    }

    @Test
    void createShift_StaffCaller_ThrowsAccessDenied() {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .build();

        assertThatThrownBy(() -> shiftService.createShift(branchA.getId(), request, staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff members cannot create shifts");
    }

    @Test
    void assignStaff_Success_NonOverlapping() {
        Instant start = Instant.parse("2026-10-07T09:00:00Z");
        Instant end = Instant.parse("2026-10-07T17:00:00Z");
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(start)
                .endTime(end)
                .status(ShiftStatus.DRAFT)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), staffA.getId())).thenReturn(false);
        when(shiftAssignmentRepository.countOverlappingAssignments(staffA.getId(), shift.getId(), start, end)).thenReturn(0L);
        when(userRepository.getReferenceById(managerAPrincipal.getId())).thenReturn(managerA);
        when(shiftRepository.save(any(Shift.class))).thenAnswer(i -> i.getArgument(0));

        ShiftResponse response = shiftService.assignStaff(shift.getId(), staffA.getId(), managerAPrincipal);

        assertThat(response.getAssignments()).hasSize(1);
        assertThat(response.getAssignments().get(0).getUserId()).isEqualTo(staffA.getId());
    }

    @Test
    void assignStaff_OverlappingInterval_ThrowsBusinessRuleException() {
        Instant start = Instant.parse("2026-10-07T09:00:00Z");
        Instant end = Instant.parse("2026-10-07T17:00:00Z");
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(start)
                .endTime(end)
                .status(ShiftStatus.DRAFT)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), staffA.getId())).thenReturn(false);
        when(shiftAssignmentRepository.countOverlappingAssignments(staffA.getId(), shift.getId(), start, end)).thenReturn(1L);

        assertThatThrownBy(() -> shiftService.assignStaff(shift.getId(), staffA.getId(), managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("overlapping shift assignment");
    }

    @Test
    void assignStaff_DuplicateAssignment_ThrowsConflictException() {
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.DRAFT)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), staffA.getId())).thenReturn(true);

        assertThatThrownBy(() -> shiftService.assignStaff(shift.getId(), staffA.getId(), managerAPrincipal))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already assigned to this shift");
    }

    @Test
    void updateShiftStatus_DraftToPublished_Success() {
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.DRAFT)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));
        when(shiftRepository.save(any(Shift.class))).thenAnswer(i -> i.getArgument(0));

        ShiftResponse response = shiftService.updateShiftStatus(shift.getId(), ShiftStatus.PUBLISHED, managerAPrincipal);

        assertThat(response.getStatus()).isEqualTo(ShiftStatus.PUBLISHED);
    }

    @Test
    void updateShiftStatus_InvalidTransition_ThrowsBusinessRuleException() {
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.COMPLETED)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));

        assertThatThrownBy(() -> shiftService.updateShiftStatus(shift.getId(), ShiftStatus.DRAFT, managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot transition shift");
    }

    @Test
    void updateShift_PublishedShiftModifyingTimes_ThrowsBusinessRuleException() {
        Instant start = Instant.parse("2026-10-07T09:00:00Z");
        Instant end = Instant.parse("2026-10-07T17:00:00Z");
        Shift shift = Shift.builder()
                .branch(branchA)
                .startTime(start)
                .endTime(end)
                .status(ShiftStatus.PUBLISHED)
                .assignments(new ArrayList<>())
                .build();
        shift.setId(UUID.randomUUID());

        UpdateShiftRequest request = UpdateShiftRequest.builder()
                .startTime(Instant.parse("2026-10-07T10:00:00Z"))
                .build();

        when(shiftRepository.findByIdWithDetails(shift.getId())).thenReturn(Optional.of(shift));

        assertThatThrownBy(() -> shiftService.updateShift(shift.getId(), request, managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot modify times of a published shift");
    }

    @Test
    void getShiftById_StaffOnlySeesPublishedAndAssigned() {
        Shift draftShift = Shift.builder()
                .branch(branchA)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.DRAFT)
                .assignments(new ArrayList<>())
                .build();
        draftShift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(draftShift.getId())).thenReturn(Optional.of(draftShift));

        // Staff viewing draft -> forbidden
        assertThatThrownBy(() -> shiftService.getShiftById(draftShift.getId(), staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff members can only view published shifts");

        // Published shift but not assigned to staffA
        Shift publishedShift = Shift.builder()
                .branch(branchA)
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.PUBLISHED)
                .assignments(new ArrayList<>())
                .build();
        publishedShift.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(publishedShift.getId())).thenReturn(Optional.of(publishedShift));

        assertThatThrownBy(() -> shiftService.getShiftById(publishedShift.getId(), staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff members can only view shifts assigned to them");

        // Published shift and assigned to staffA
        ShiftAssignment assignment = ShiftAssignment.builder()
                .shift(publishedShift)
                .user(staffA)
                .assignedBy(managerA)
                .assignedAt(Instant.now())
                .build();
        publishedShift.setAssignments(new ArrayList<>(java.util.List.of(assignment)));

        ShiftResponse response = shiftService.getShiftById(publishedShift.getId(), staffAPrincipal);
        assertThat(response.getId()).isEqualTo(publishedShift.getId());
    }
}
