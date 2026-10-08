package com.shiftops.issue.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.common.storage.StorageService;
import com.shiftops.issue.dto.*;
import com.shiftops.issue.entity.*;
import com.shiftops.issue.repository.IssueAttachmentRepository;
import com.shiftops.issue.repository.IssueCommentRepository;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {

    @Mock
    private IssueRepository issueRepository;
    @Mock
    private IssueCommentRepository commentRepository;
    @Mock
    private IssueAttachmentRepository attachmentRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private BranchAccessService branchAccessService;
    @Mock
    private StorageService storageService;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private IssueService issueService;

    private Clock fixedClock;
    private Instant fixedInstant;

    private Branch branchA;
    private Branch branchB;
    private User staff1;
    private User staff2;
    private User manager;
    private UserPrincipal staff1Principal;
    private UserPrincipal managerPrincipal;

    @BeforeEach
    void setUp() {
        fixedInstant = Instant.parse("2026-10-10T10:00:00Z");
        fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));
        issueService.setClock(fixedClock);

        branchA = Branch.builder()
                .name("Branch Alpha")
                .isActive(true)
                .build();
        branchA.setId(UUID.randomUUID());

        branchB = Branch.builder()
                .name("Branch Beta")
                .isActive(true)
                .build();
        branchB.setId(UUID.randomUUID());

        staff1 = User.builder()
                .email("staff1@shiftops.com")
                .fullName("Staff One")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        staff1.setId(UUID.randomUUID());

        staff2 = User.builder()
                .email("staff2@shiftops.com")
                .fullName("Staff Two")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        staff2.setId(UUID.randomUUID());

        manager = User.builder()
                .email("manager@shiftops.com")
                .fullName("Branch Manager")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        manager.setId(UUID.randomUUID());

        staff1Principal = UserPrincipal.create(staff1);
        managerPrincipal = UserPrincipal.create(manager);
    }

    @Test
    void testCreateIssue_ByStaff_Success() {
        CreateIssueRequest request = CreateIssueRequest.builder()
                .title("Leaking AC")
                .description("AC leaking in kitchen area")
                .category(IssueCategory.FACILITY)
                .priority(IssuePriority.HIGH)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(userRepository.findById(staff1.getId())).thenReturn(Optional.of(staff1));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> {
            Issue i = invocation.getArgument(0);
            i.setId(UUID.randomUUID());
            return i;
        });

        IssueResponse response = issueService.createIssue(request, staff1Principal);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Leaking AC");
        assertThat(response.getCategory()).isEqualTo(IssueCategory.FACILITY);
        assertThat(response.getPriority()).isEqualTo(IssuePriority.HIGH);
        assertThat(response.getStatus()).isEqualTo(IssueStatus.OPEN);
        assertThat(response.getReportedById()).isEqualTo(staff1.getId());
    }

    @Test
    void testCreateIssue_StaffCrossBranch_Rejected() {
        CreateIssueRequest request = CreateIssueRequest.builder()
                .branchId(branchB.getId()) // Different branch
                .title("Broken lock")
                .description("Lock broken")
                .category(IssueCategory.FACILITY)
                .build();

        assertThatThrownBy(() -> issueService.createIssue(request, staff1Principal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff can only report issues for their assigned branch");
    }

    @Test
    void testCreateIssue_InactiveBranch_ThrowsException() {
        branchA.setActive(false);
        CreateIssueRequest request = CreateIssueRequest.builder()
                .title("Test")
                .description("Desc")
                .category(IssueCategory.OTHER)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));

        assertThatThrownBy(() -> issueService.createIssue(request, staff1Principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive branch");
    }

    @Test
    void testAssignIssue_StaffInactive_ThrowsException() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.OPEN)
                .build();
        issue.setId(UUID.randomUUID());

        staff2.setActive(false); // Inactive

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));
        when(userRepository.findById(staff2.getId())).thenReturn(Optional.of(staff2));

        AssignIssueRequest request = AssignIssueRequest.builder().assignedToUserId(staff2.getId()).build();

        assertThatThrownBy(() -> issueService.assignIssue(issue.getId(), request, managerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive staff member");
    }

    @Test
    void testAssignIssue_DifferentBranch_ThrowsException() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.OPEN)
                .build();
        issue.setId(UUID.randomUUID());

        User branchBStaff = User.builder()
                .email("beta@shiftops.com")
                .primaryBranch(branchB)
                .isActive(true)
                .build();
        branchBStaff.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));
        when(userRepository.findById(branchBStaff.getId())).thenReturn(Optional.of(branchBStaff));

        AssignIssueRequest request = AssignIssueRequest.builder().assignedToUserId(branchBStaff.getId()).build();

        assertThatThrownBy(() -> issueService.assignIssue(issue.getId(), request, managerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("different branch");
    }

    @Test
    void testAssignIssue_Success_TransitionsToAssigned() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.OPEN)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));
        when(userRepository.findById(staff2.getId())).thenReturn(Optional.of(staff2));
        when(userRepository.getReferenceById(managerPrincipal.getId())).thenReturn(manager);
        when(issueRepository.save(any(Issue.class))).thenAnswer(i -> i.getArgument(0));

        AssignIssueRequest request = AssignIssueRequest.builder().assignedToUserId(staff2.getId()).build();
        IssueResponse response = issueService.assignIssue(issue.getId(), request, managerPrincipal);

        assertThat(response.getStatus()).isEqualTo(IssueStatus.ASSIGNED);
        assertThat(response.getAssignedToId()).isEqualTo(staff2.getId());
    }

    @Test
    void testUpdateStatus_ByAssignedStaff_ToInProgressAndResolved() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff2)
                .assignedTo(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.ASSIGNED)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));
        when(userRepository.getReferenceById(staff1Principal.getId())).thenReturn(staff1);
        when(issueRepository.save(any(Issue.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Transition ASSIGNED -> IN_PROGRESS
        UpdateIssueStatusRequest req1 = UpdateIssueStatusRequest.builder().status(IssueStatus.IN_PROGRESS).build();
        IssueResponse res1 = issueService.updateIssueStatus(issue.getId(), req1, staff1Principal);
        assertThat(res1.getStatus()).isEqualTo(IssueStatus.IN_PROGRESS);
        assertThat(res1.getResolvedAt()).isNull();

        // 2. Transition IN_PROGRESS -> RESOLVED
        UpdateIssueStatusRequest req2 = UpdateIssueStatusRequest.builder().status(IssueStatus.RESOLVED).build();
        IssueResponse res2 = issueService.updateIssueStatus(issue.getId(), req2, staff1Principal);
        assertThat(res2.getStatus()).isEqualTo(IssueStatus.RESOLVED);
        assertThat(res2.getResolvedAt()).isEqualTo(fixedInstant);
        assertThat(res2.getResolvedById()).isEqualTo(staff1.getId());
    }

    @Test
    void testUpdateStatus_StaffCannotCloseOrCancel() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff2)
                .assignedTo(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.RESOLVED)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));

        UpdateIssueStatusRequest req = UpdateIssueStatusRequest.builder().status(IssueStatus.CLOSED).build();

        assertThatThrownBy(() -> issueService.updateIssueStatus(issue.getId(), req, staff1Principal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only managers can close or cancel issues");
    }

    @Test
    void testUpdateStatus_ManagerCanCloseResolvedIssue() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff2)
                .assignedTo(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.RESOLVED)
                .resolvedAt(fixedInstant)
                .resolvedBy(staff1)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));
        when(userRepository.getReferenceById(managerPrincipal.getId())).thenReturn(manager);
        when(issueRepository.save(any(Issue.class))).thenAnswer(i -> i.getArgument(0));

        UpdateIssueStatusRequest req = UpdateIssueStatusRequest.builder().status(IssueStatus.CLOSED).build();
        IssueResponse res = issueService.updateIssueStatus(issue.getId(), req, managerPrincipal);

        assertThat(res.getStatus()).isEqualTo(IssueStatus.CLOSED);
        assertThat(res.getClosedAt()).isEqualTo(fixedInstant);
        assertThat(res.getClosedById()).isEqualTo(manager.getId());
    }

    @Test
    void testUpdateStatus_ClosedIssue_CannotBeModified() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff2)
                .assignedTo(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.CLOSED)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));

        UpdateIssueStatusRequest req = UpdateIssueStatusRequest.builder().status(IssueStatus.IN_PROGRESS).build();

        assertThatThrownBy(() -> issueService.updateIssueStatus(issue.getId(), req, managerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Closed issue cannot be modified");
    }

    @Test
    void testAddAttachment_InvalidMimeType_Rejected() {
        Issue issue = Issue.builder()
                .branch(branchA)
                .reportedBy(staff1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.OPEN)
                .build();
        issue.setId(UUID.randomUUID());

        when(issueRepository.findByIdWithDetails(issue.getId())).thenReturn(Optional.of(issue));

        MockMultipartFile file = new MockMultipartFile(
                "file", "script.exe", "application/octet-stream", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> issueService.addAttachment(issue.getId(), file, staff1Principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only JPEG, PNG, and WebP images are allowed");
    }
}
