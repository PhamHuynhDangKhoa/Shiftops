package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.issue.dto.AssignIssueRequest;
import com.shiftops.issue.dto.CreateIssueCommentRequest;
import com.shiftops.issue.dto.CreateIssueRequest;
import com.shiftops.issue.dto.UpdateIssueStatusRequest;
import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.repository.IssueAttachmentRepository;
import com.shiftops.issue.repository.IssueCommentRepository;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase6IntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private IssueAttachmentRepository attachmentRepository;
    @Autowired
    private IssueCommentRepository commentRepository;
    @Autowired
    private IssueRepository issueRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private TaskTemplateRepository taskTemplateRepository;
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired
    private ShiftRepository shiftRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private com.shiftops.notification.repository.NotificationRepository notificationRepository;
    @Autowired
    private com.shiftops.announcement.repository.AnnouncementRepository announcementRepository;

    private Branch branchA;
    private Branch branchB;
    private User owner;
    private User managerA;
    private User managerB;
    private User staffA1;
    private User staffA2;
    private User staffB;

    private String ownerToken;
    private String managerAToken;
    private String managerBToken;
    private String staffA1Token;
    private String staffA2Token;
    private String staffBToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
        attachmentRepository.deleteAll();
        commentRepository.deleteAll();
        issueRepository.deleteAll();
        taskRepository.deleteAll();
        taskTemplateRepository.deleteAll();
        attendanceRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();

        branchA = branchRepository.save(Branch.builder()
                .name("Alpha Branch")
                .address("100 Alpha St")
                .timezone("UTC")
                .isActive(true)
                .build());

        branchB = branchRepository.save(Branch.builder()
                .name("Beta Branch")
                .address("200 Beta St")
                .timezone("UTC")
                .isActive(true)
                .build());

        owner = userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash("hash")
                .fullName("System Owner")
                .role(Role.OWNER)
                .isActive(true)
                .build());

        managerA = userRepository.save(User.builder()
                .email("manager.alpha@shiftops.com")
                .passwordHash("hash")
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        managerB = userRepository.save(User.builder()
                .email("manager.beta@shiftops.com")
                .passwordHash("hash")
                .fullName("Manager Beta")
                .role(Role.MANAGER)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        staffA1 = userRepository.save(User.builder()
                .email("staff.alpha1@shiftops.com")
                .passwordHash("hash")
                .fullName("Staff Alpha 1")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffA2 = userRepository.save(User.builder()
                .email("staff.alpha2@shiftops.com")
                .passwordHash("hash")
                .fullName("Staff Alpha 2")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffB = userRepository.save(User.builder()
                .email("staff.beta@shiftops.com")
                .passwordHash("hash")
                .fullName("Staff Beta")
                .role(Role.STAFF)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        ownerToken = jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAToken = jwtTokenProvider.generateToken(UserPrincipal.create(managerA));
        managerBToken = jwtTokenProvider.generateToken(UserPrincipal.create(managerB));
        staffA1Token = jwtTokenProvider.generateToken(UserPrincipal.create(staffA1));
        staffA2Token = jwtTokenProvider.generateToken(UserPrincipal.create(staffA2));
        staffBToken = jwtTokenProvider.generateToken(UserPrincipal.create(staffB));
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
        attachmentRepository.deleteAll();
        commentRepository.deleteAll();
        issueRepository.deleteAll();
        taskRepository.deleteAll();
        taskTemplateRepository.deleteAll();
        attendanceRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();
    }

    @Test
    void testStaffCreatesIssue_Success_ReporterBoundToAuthUser() throws Exception {
        CreateIssueRequest request = CreateIssueRequest.builder()
                .title("Espresso Machine Leaking")
                .description("Steam wand is leaking boiling water")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.HIGH)
                .build();

        mockMvc.perform(post("/v1/issues")
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Espresso Machine Leaking"))
                .andExpect(jsonPath("$.data.category").value("EQUIPMENT"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.branchId").value(branchA.getId().toString()))
                .andExpect(jsonPath("$.data.reportedById").value(staffA1.getId().toString()));

        List<Issue> issues = issueRepository.findAll();
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getReportedBy().getId()).isEqualTo(staffA1.getId());
    }

    @Test
    void testStaffCreatesIssue_CrossBranch_Rejected() throws Exception {
        CreateIssueRequest request = CreateIssueRequest.builder()
                .branchId(branchB.getId()) // Different branch
                .title("Front Door Broken")
                .description("Lock is jammed")
                .category(IssueCategory.FACILITY)
                .build();

        mockMvc.perform(post("/v1/issues")
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testManagerBranchAuthorization() throws Exception {
        // Manager Alpha creates an issue in Branch Alpha
        Issue issueA = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(managerA)
                .title("Alpha Freezer Issue")
                .description("Temp rising")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.URGENT)
                .status(IssueStatus.OPEN)
                .build());

        // Manager A can view own branch issues
        mockMvc.perform(get("/v1/branches/{branchId}/issues", branchA.getId())
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id").value(issueA.getId().toString()));

        // Manager B CANNOT view Branch A issues (403)
        mockMvc.perform(get("/v1/branches/{branchId}/issues", branchA.getId())
                        .header("Authorization", "Bearer " + managerBToken))
                .andExpect(status().isForbidden());

        // Owner CAN view Branch A issues (global access)
        mockMvc.perform(get("/v1/branches/{branchId}/issues", branchA.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    void testAssignIssue_SameBranchSuccess_OtherBranchRejected() throws Exception {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .title("POS Offline")
                .description("Register 2 screen frozen")
                .category(IssueCategory.EQUIPMENT)
                .status(IssueStatus.OPEN)
                .build());

        // 1. Assign to staff from another branch -> REJECTED
        AssignIssueRequest badAssign = AssignIssueRequest.builder().assignedToUserId(staffB.getId()).build();
        mockMvc.perform(patch("/v1/issues/{id}/assign", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badAssign)))
                .andExpect(status().isUnprocessableEntity());

        // 2. Assign to same-branch staff -> SUCCESS
        AssignIssueRequest goodAssign = AssignIssueRequest.builder().assignedToUserId(staffA2.getId()).build();
        mockMvc.perform(patch("/v1/issues/{id}/assign", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodAssign)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.assignedToId").value(staffA2.getId().toString()));

        // Verify assignment comment added
        var comments = commentRepository.findByIssueIdOrderByCreatedAtAsc(issue.getId());
        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getMessage()).contains("Assigned issue to Staff Alpha 2");
    }

    @Test
    void testAssignIssue_ToInactiveStaff_Rejected() throws Exception {
        staffA2.setActive(false);
        userRepository.save(staffA2);

        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.MAINTENANCE)
                .status(IssueStatus.OPEN)
                .build());

        AssignIssueRequest assign = AssignIssueRequest.builder().assignedToUserId(staffA2.getId()).build();
        mockMvc.perform(patch("/v1/issues/{id}/assign", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assign)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void testFullStatusWorkflow_AndTimestamps() throws Exception {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .assignedTo(staffA1)
                .title("Plumbing Leak")
                .description("Sink pipe dripping")
                .category(IssueCategory.MAINTENANCE)
                .status(IssueStatus.ASSIGNED)
                .build());

        // 1. Staff transitions ASSIGNED -> IN_PROGRESS
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.IN_PROGRESS).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.resolvedAt").doesNotExist());

        // 2. Staff transitions IN_PROGRESS -> RESOLVED
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder()
                                .status(IssueStatus.RESOLVED)
                                .comment("Tightened pipe fitting")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.resolvedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.resolvedById").value(staffA1.getId().toString()));

        // 3. Staff cannot close issue (403)
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.CLOSED).build())))
                .andExpect(status().isForbidden());

        // 4. Manager closes issue -> SUCCESS, closedAt recorded
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.CLOSED).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"))
                .andExpect(jsonPath("$.data.closedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.closedById").value(managerA.getId().toString()));

        // 5. Closed issue cannot be modified
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.IN_PROGRESS).build())))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void testInvalidStatusTransitions_Rejected() throws Exception {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .title("Issue")
                .description("Desc")
                .category(IssueCategory.SAFETY)
                .status(IssueStatus.OPEN)
                .build());

        // OPEN -> CLOSED (Invalid leap)
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.CLOSED).build())))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void testStaffCannotEditAnotherUsersIssue() throws Exception {
        // Issue assigned to Staff A2
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(managerA)
                .assignedTo(staffA2)
                .title("Inventory Low")
                .description("Out of oat milk")
                .category(IssueCategory.INVENTORY)
                .status(IssueStatus.ASSIGNED)
                .build());

        // Staff A1 attempts to transition status -> FORBIDDEN (403)
        mockMvc.perform(patch("/v1/issues/{id}/status", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateIssueStatusRequest.builder().status(IssueStatus.IN_PROGRESS).build())))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCommentsThread() throws Exception {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .title("Pest Sighting")
                .description("Fly in storage room")
                .category(IssueCategory.SAFETY)
                .status(IssueStatus.OPEN)
                .build());

        // Staff comments
        mockMvc.perform(post("/v1/issues/{id}/comments", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateIssueCommentRequest.builder().message("Traps deployed").build())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.message").value("Traps deployed"))
                .andExpect(jsonPath("$.data.authorId").value(staffA1.getId().toString()));

        // Manager comments
        mockMvc.perform(post("/v1/issues/{id}/comments", issue.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateIssueCommentRequest.builder().message("Exterminator scheduled for Friday").build())))
                .andExpect(status().isCreated());

        // Verify issue detail returns both comments in order
        mockMvc.perform(get("/v1/issues/{id}", issue.getId())
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.comments", hasSize(2)))
                .andExpect(jsonPath("$.data.comments[0].message").value("Traps deployed"))
                .andExpect(jsonPath("$.data.comments[1].message").value("Exterminator scheduled for Friday"));
    }

    @Test
    void testImageAttachmentUploadAndFetch() throws Exception {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchA)
                .reportedBy(staffA1)
                .title("Damaged Chair")
                .description("Chair leg cracked")
                .category(IssueCategory.FACILITY)
                .status(IssueStatus.OPEN)
                .build());

        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "chair.png", "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        String responseJson = mockMvc.perform(multipart("/v1/issues/{id}/attachments", issue.getId())
                        .file(imageFile)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.originalFileName").value("chair.png"))
                .andExpect(jsonPath("$.data.contentType").value("image/png"))
                .andReturn().getResponse().getContentAsString();

        UUID attachmentId = UUID.fromString(objectMapper.readTree(responseJson).get("data").get("id").asText());

        // Fetch attachment file
        mockMvc.perform(get("/v1/issues/{id}/attachments/{attachmentId}/file", issue.getId(), attachmentId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"));
    }

    @Test
    void testPaginationAndFiltering() throws Exception {
        for (int i = 1; i <= 5; i++) {
            issueRepository.save(Issue.builder()
                    .branch(branchA)
                    .reportedBy(staffA1)
                    .title("Issue " + i)
                    .description("Desc " + i)
                    .category(i % 2 == 0 ? IssueCategory.EQUIPMENT : IssueCategory.MAINTENANCE)
                    .priority(i == 1 ? IssuePriority.URGENT : IssuePriority.NORMAL)
                    .status(i <= 3 ? IssueStatus.OPEN : IssueStatus.RESOLVED)
                    .build());
        }

        // Filter status = OPEN
        mockMvc.perform(get("/v1/branches/{branchId}/issues", branchA.getId())
                        .param("status", "OPEN")
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(3)));

        // Filter priority = URGENT
        mockMvc.perform(get("/v1/branches/{branchId}/issues", branchA.getId())
                        .param("priority", "URGENT")
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].priority").value("URGENT"));
    }

    @Test
    void testOptionalTaskRelationship() throws Exception {
        // Create shift, assignment, and task
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Morning Shift")
                .startTime(Instant.now().minusSeconds(3600))
                .endTime(Instant.now().plusSeconds(3600))
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment assignment = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffA1)
                .assignedBy(managerA)
                .assignedAt(Instant.now())
                .build());

        Task task = taskRepository.save(Task.builder()
                .shiftAssignment(assignment)
                .title("Inspect Coffee Machine")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.IN_PROGRESS)
                .build());

        CreateIssueRequest request = CreateIssueRequest.builder()
                .title("Water Boiler Not Heating")
                .description("Discovered during morning inspection")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.HIGH)
                .shiftAssignmentId(assignment.getId())
                .taskId(task.getId())
                .build();

        mockMvc.perform(post("/v1/issues")
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.shiftAssignmentId").value(assignment.getId().toString()))
                .andExpect(jsonPath("$.data.taskId").value(task.getId().toString()));
    }
}
