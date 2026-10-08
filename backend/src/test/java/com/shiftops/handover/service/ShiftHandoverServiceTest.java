package com.shiftops.handover.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.dto.AcknowledgeHandoverRequest;
import com.shiftops.handover.dto.CreateHandoverRequest;
import com.shiftops.handover.dto.HandoverItemRequest;
import com.shiftops.handover.dto.ShiftHandoverResponse;
import com.shiftops.handover.dto.UpdateHandoverRequest;
import com.shiftops.handover.entity.HandoverItem;
import com.shiftops.handover.entity.HandoverItemType;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import com.shiftops.handover.repository.HandoverItemRepository;
import com.shiftops.handover.repository.ShiftHandoverRepository;
import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.task.repository.TaskRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiftHandoverServiceTest {

    @Mock
    private ShiftHandoverRepository handoverRepository;

    @Mock
    private HandoverItemRepository itemRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @Mock
    private Clock clock;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ShiftHandoverService handoverService;

    private Branch branch;
    private User staffUser;
    private User otherStaffUser;
    private User managerUser;
    private User ownerUser;
    private UserPrincipal staffPrincipal;
    private UserPrincipal otherStaffPrincipal;
    private UserPrincipal managerPrincipal;
    private UserPrincipal ownerPrincipal;
    private Shift shift;
    private final Instant now = Instant.parse("2026-10-10T12:00:00Z");

    @BeforeEach
    void setUp() {
        branch = Branch.builder()
                .name("Downtown Store")
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

        ownerUser = User.builder()
                .email("owner@shiftops.com")
                .fullName("Owner Dan")
                .role(Role.OWNER)
                .isActive(true)
                .build();
        ownerUser.setId(UUID.randomUUID());

        staffPrincipal = UserPrincipal.create(staffUser);
        otherStaffPrincipal = UserPrincipal.create(otherStaffUser);
        managerPrincipal = UserPrincipal.create(managerUser);
        ownerPrincipal = UserPrincipal.create(ownerUser);

        shift = Shift.builder()
                .branch(branch)
                .name("Morning Shift")
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.PUBLISHED)
                .build();
        shift.setId(UUID.randomUUID());
    }

    @Test
    void createOrGetDraftHandover_whenNotExists_shouldCreateDraft() {
        UUID shiftId = shift.getId();
        CreateHandoverRequest request = CreateHandoverRequest.builder()
                .notes("Morning wrap-up notes")
                .items(List.of(
                        HandoverItemRequest.builder()
                                .type(HandoverItemType.COMPLETED)
                                .content("Completed counter sanitization")
                                .orderIndex(1)
                                .build()
                ))
                .build();

        when(shiftRepository.findByIdWithDetails(shiftId)).thenReturn(Optional.of(shift));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shiftId, staffPrincipal.getId())).thenReturn(true);
        when(handoverRepository.findByShiftIdWithDetails(shiftId)).thenReturn(Optional.empty());
        when(handoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> {
            ShiftHandover saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        ShiftHandoverResponse response = handoverService.createOrGetDraftHandover(shiftId, request, staffPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.notes()).isEqualTo("Morning wrap-up notes");
        assertThat(response.status()).isEqualTo(HandoverStatus.DRAFT);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).content()).isEqualTo("Completed counter sanitization");
        verify(branchAccessService).validateBranchAccess(staffPrincipal, branch.getId());
    }

    @Test
    void createOrGetDraftHandover_whenAlreadyExists_shouldReturnExisting() {
        UUID shiftId = shift.getId();
        ShiftHandover existing = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.DRAFT)
                .notes("Existing draft notes")
                .build();
        existing.setId(UUID.randomUUID());

        when(shiftRepository.findByIdWithDetails(shiftId)).thenReturn(Optional.of(shift));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shiftId, staffPrincipal.getId())).thenReturn(true);
        when(handoverRepository.findByShiftIdWithDetails(shiftId)).thenReturn(Optional.of(existing));

        ShiftHandoverResponse response = handoverService.createOrGetDraftHandover(shiftId, null, staffPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(existing.getId());
        assertThat(response.notes()).isEqualTo("Existing draft notes");
        verify(handoverRepository, never()).save(any());
    }

    @Test
    void createOrGetDraftHandover_whenShiftCancelled_shouldThrowException() {
        UUID shiftId = shift.getId();
        shift.setStatus(ShiftStatus.CANCELLED);

        when(shiftRepository.findByIdWithDetails(shiftId)).thenReturn(Optional.of(shift));

        assertThatThrownBy(() -> handoverService.createOrGetDraftHandover(shiftId, null, staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot create handover for a cancelled shift");
    }

    @Test
    void createOrGetDraftHandover_whenStaffNotAssigned_shouldThrowAccessDenied() {
        UUID shiftId = shift.getId();

        when(shiftRepository.findByIdWithDetails(shiftId)).thenReturn(Optional.of(shift));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shiftId, otherStaffPrincipal.getId())).thenReturn(false);

        assertThatThrownBy(() -> handoverService.createOrGetDraftHandover(shiftId, null, otherStaffPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff can only create handover for their assigned shifts");
    }

    @Test
    void updateDraftHandover_whenInDraftStatus_shouldUpdateSuccessfully() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.DRAFT)
                .notes("Original notes")
                .items(new ArrayList<>())
                .build();
        handover.setId(handoverId);

        UpdateHandoverRequest request = UpdateHandoverRequest.builder()
                .notes("Updated notes")
                .items(List.of(
                        HandoverItemRequest.builder()
                                .type(HandoverItemType.PENDING)
                                .content("Stocking pastries pending")
                                .orderIndex(1)
                                .build()
                ))
                .build();

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), staffPrincipal.getId())).thenReturn(true);
        when(handoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftHandoverResponse response = handoverService.updateDraftHandover(handoverId, request, staffPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.notes()).isEqualTo("Updated notes");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).content()).isEqualTo("Stocking pastries pending");
    }

    @Test
    void updateDraftHandover_whenSubmitted_shouldThrowException() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.SUBMITTED)
                .notes("Submitted notes")
                .build();
        handover.setId(handoverId);

        UpdateHandoverRequest request = UpdateHandoverRequest.builder().notes("Attempted edit").build();

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));

        assertThatThrownBy(() -> handoverService.updateDraftHandover(handoverId, request, staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only draft handovers can be updated");
    }

    @Test
    void submitHandover_whenDraft_shouldTransitionToSubmitted() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.DRAFT)
                .notes("Final notes before submit")
                .items(new ArrayList<>())
                .build();
        handover.setId(handoverId);

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));
        when(shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), staffPrincipal.getId())).thenReturn(true);
        when(userRepository.findById(staffPrincipal.getId())).thenReturn(Optional.of(staffUser));
        when(clock.instant()).thenReturn(now);
        when(handoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftHandoverResponse response = handoverService.submitHandover(handoverId, staffPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(HandoverStatus.SUBMITTED);
        assertThat(response.submittedById()).isEqualTo(staffUser.getId());
        assertThat(response.submittedAt()).isEqualTo(now);
    }

    @Test
    void submitHandover_whenAlreadySubmitted_shouldThrowException() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.SUBMITTED)
                .build();
        handover.setId(handoverId);

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));

        assertThatThrownBy(() -> handoverService.submitHandover(handoverId, staffPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot submit handover in status: SUBMITTED");
    }

    @Test
    void acknowledgeHandover_whenSubmitted_shouldTransitionToAcknowledged() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.SUBMITTED)
                .submittedBy(staffUser)
                .submittedAt(now.minusSeconds(3600))
                .items(new ArrayList<>())
                .build();
        handover.setId(handoverId);

        AcknowledgeHandoverRequest request = AcknowledgeHandoverRequest.builder()
                .notes("Acknowledged by afternoon shift, resuming pastry stock.")
                .build();

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));
        when(userRepository.findById(managerPrincipal.getId())).thenReturn(Optional.of(managerUser));
        when(clock.instant()).thenReturn(now);
        when(handoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftHandoverResponse response = handoverService.acknowledgeHandover(handoverId, request, managerPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(HandoverStatus.ACKNOWLEDGED);
        assertThat(response.acknowledgedById()).isEqualTo(managerUser.getId());
        assertThat(response.acknowledgedAt()).isEqualTo(now);
        assertThat(response.acknowledgementNotes()).isEqualTo("Acknowledged by afternoon shift, resuming pastry stock.");
    }

    @Test
    void acknowledgeHandover_whenInDraftStatus_shouldThrowException() {
        UUID handoverId = UUID.randomUUID();
        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(branch)
                .status(HandoverStatus.DRAFT)
                .build();
        handover.setId(handoverId);

        when(handoverRepository.findByIdWithDetails(handoverId)).thenReturn(Optional.of(handover));

        assertThatThrownBy(() -> handoverService.acknowledgeHandover(handoverId, null, managerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot acknowledge handover in status: DRAFT");
    }

    @Test
    void computeSummary_shouldDeriveTaskAndIssueMetricsCorrectly() {
        Task t1 = Task.builder().status(TaskStatus.COMPLETED).build();
        Task t2 = Task.builder().status(TaskStatus.TODO).build();
        Task t3 = Task.builder().status(TaskStatus.IN_PROGRESS).build();
        Task t4 = Task.builder().status(TaskStatus.CANCELLED).build();

        when(taskRepository.findByShiftId(shift.getId())).thenReturn(List.of(t1, t2, t3, t4));
        when(issueRepository.countByBranchIdAndStatusIn(eq(branch.getId()), any())).thenReturn(5L);
        when(shiftAssignmentRepository.countByShiftId(shift.getId())).thenReturn(2L);

        var summary = handoverService.computeSummary(shift);

        assertThat(summary.totalTasks()).isEqualTo(4);
        assertThat(summary.completedTasks()).isEqualTo(1);
        assertThat(summary.pendingTasks()).isEqualTo(2); // TODO and IN_PROGRESS
        assertThat(summary.openBranchIssues()).isEqualTo(5);
        assertThat(summary.staffAssignedCount()).isEqualTo(2);
    }
}
