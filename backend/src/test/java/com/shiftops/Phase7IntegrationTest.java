package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.dto.AcknowledgeHandoverRequest;
import com.shiftops.handover.dto.CreateHandoverRequest;
import com.shiftops.handover.dto.HandoverItemRequest;
import com.shiftops.handover.dto.UpdateHandoverRequest;
import com.shiftops.handover.entity.HandoverItemType;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import com.shiftops.handover.repository.HandoverItemRepository;
import com.shiftops.handover.repository.ShiftHandoverRepository;
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
public class Phase7IntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ShiftHandoverRepository shiftHandoverRepository;
    @Autowired
    private HandoverItemRepository handoverItemRepository;
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
    private com.shiftops.notification.repository.NotificationRepository notificationRepository;
    @Autowired
    private com.shiftops.announcement.repository.AnnouncementRepository announcementRepository;
    @Autowired
    private BranchRepository branchRepository;

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

    private Shift morningShiftA;
    private ShiftAssignment assignmentA1;

    @BeforeEach
    void setUp() {
        cleanDatabase();

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

        morningShiftA = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Morning Alpha Shift")
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.PUBLISHED)
                .build());

        assignmentA1 = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(morningShiftA)
                .user(staffA1)
                .assignedBy(managerA)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
        handoverItemRepository.deleteAll();
        shiftHandoverRepository.deleteAll();
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

    // 1. Create draft handover
    @Test
    void test1_CreateDraftHandover_Success() throws Exception {
        CreateHandoverRequest request = CreateHandoverRequest.builder()
                .notes("Shift went smoothly, cold brew restocked.")
                .items(List.of(
                        HandoverItemRequest.builder()
                                .type(HandoverItemType.COMPLETED)
                                .content("Sanitized pastry display")
                                .orderIndex(1)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.shiftId").value(morningShiftA.getId().toString()))
                .andExpect(jsonPath("$.data.notes").value("Shift went smoothly, cold brew restocked."))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].content").value("Sanitized pastry display"));
    }

    // 2. Staff assignment authorization: unassigned staff denied
    @Test
    void test2_StaffAssignmentAuthorization_UnassignedStaffDenied() throws Exception {
        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // 3. Edit draft
    @Test
    void test3_EditDraft_Success() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Initial draft\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        UpdateHandoverRequest updateReq = UpdateHandoverRequest.builder()
                .notes("Updated draft notes before departure")
                .items(List.of(
                        HandoverItemRequest.builder()
                                .type(HandoverItemType.NOTE)
                                .content("VIP customer reservation at 5 PM")
                                .orderIndex(1)
                                .build()
                ))
                .build();

        mockMvc.perform(put("/v1/handovers/{id}", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notes").value("Updated draft notes before departure"))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].content").value("VIP customer reservation at 5 PM"));
    }

    // 4. Submit handover
    @Test
    void test4_SubmitHandover_Success() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Ready to submit\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.submittedById").value(staffA1.getId().toString()))
                .andExpect(jsonPath("$.data.submittedByName").value("Staff Alpha 1"))
                .andExpect(jsonPath("$.data.submittedAt").isNotEmpty());
    }

    // 5. Invalid transition rejected
    @Test
    void test5_InvalidTransitionRejected_CannotSubmitAlreadySubmitted() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        // First submit
        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        // Second submit -> rejected with 422
        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("INVALID_HANDOVER_STATE"));
    }

    // 6. Submitted handover cannot be freely edited
    @Test
    void test6_SubmittedHandoverCannotBeFreelyEdited() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        // Attempt edit
        UpdateHandoverRequest updateReq = UpdateHandoverRequest.builder()
                .notes("Hacking submitted notes")
                .build();

        mockMvc.perform(put("/v1/handovers/{id}", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("INVALID_HANDOVER_STATE"));
    }

    // 7. Acknowledge handover
    @Test
    void test7_AcknowledgeHandover_Success() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        AcknowledgeHandoverRequest ackReq = AcknowledgeHandoverRequest.builder()
                .notes("Read and confirmed by afternoon manager.")
                .build();

        mockMvc.perform(patch("/v1/handovers/{id}/acknowledge", handoverId)
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ackReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.data.acknowledgedById").value(managerA.getId().toString()))
                .andExpect(jsonPath("$.data.acknowledgedByName").value("Manager Alpha"))
                .andExpect(jsonPath("$.data.acknowledgementNotes").value("Read and confirmed by afternoon manager."))
                .andExpect(jsonPath("$.data.acknowledgedAt").isNotEmpty());
    }

    // 8. Acknowledged handover immutable
    @Test
    void test8_AcknowledgedHandoverImmutable() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/v1/handovers/{id}/acknowledge", handoverId)
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        // Attempting acknowledge again
        mockMvc.perform(patch("/v1/handovers/{id}/acknowledge", handoverId)
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("INVALID_HANDOVER_STATE"));

        // Attempting edit
        mockMvc.perform(put("/v1/handovers/{id}", handoverId)
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Overriding acknowledged handover\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("INVALID_HANDOVER_STATE"));
    }

    // 9. Duplicate handover rejected / idempotent draft
    @Test
    void test9_DuplicateHandover_IdempotentDraft() throws Exception {
        String firstJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"First call\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String firstId = objectMapper.readTree(firstJson).path("data").path("id").asText();

        String secondJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Second call\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String secondId = objectMapper.readTree(secondJson).path("data").path("id").asText();

        assertThat(firstId).isEqualTo(secondId);
        assertThat(shiftHandoverRepository.count()).isEqualTo(1);
    }

    // 10. Manager branch isolation
    @Test
    void test10_ManagerBranchIsolation() throws Exception {
        mockMvc.perform(get("/v1/branches/{branchId}/handovers", branchA.getId())
                        .header("Authorization", "Bearer " + managerBToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // 11. Owner cross-branch access
    @Test
    void test11_OwnerCrossBranchAccess() throws Exception {
        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/v1/branches/{branchId}/handovers", branchA.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    // 12. Staff cannot access another branch's handover
    @Test
    void test12_StaffCannotAccessOtherBranchHandover() throws Exception {
        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffBToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // 13. Cancelled shift rejection
    @Test
    void test13_CancelledShiftRejection() throws Exception {
        Shift cancelledShift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Cancelled Shift")
                .startTime(Instant.parse("2026-10-11T08:00:00Z"))
                .endTime(Instant.parse("2026-10-11T16:00:00Z"))
                .status(ShiftStatus.CANCELLED)
                .build());

        shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(cancelledShift)
                .user(staffA1)
                .assignedBy(managerA)
                .build());

        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", cancelledShift.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("SHIFT_CANCELLED"));
    }

    // 14. Inactive staff historical access
    @Test
    void test14_InactiveStaffHistoricalAccess() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        // Deactivate staffA1
        staffA1.setActive(false);
        userRepository.save(staffA1);

        // Manager A still accesses the submitted handover
        mockMvc.perform(get("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submittedById").value(staffA1.getId().toString()))
                .andExpect(jsonPath("$.data.submittedByName").value("Staff Alpha 1"));
    }

    // 15. Removed assignment historical preservation
    @Test
    void test15_RemovedAssignmentHistoricalPreservation() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        // Remove assignment
        shiftAssignmentRepository.delete(assignmentA1);

        mockMvc.perform(get("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submittedById").value(staffA1.getId().toString()));
    }

    // 16. Derived task summary computation
    @Test
    void test16_DerivedTaskSummaryComputation() throws Exception {
        taskRepository.save(Task.builder()
                .shiftAssignment(assignmentA1)
                .title("Complete checklist 1")
                .status(TaskStatus.COMPLETED)
                .priority(TaskPriority.NORMAL)
                .build());

        taskRepository.save(Task.builder()
                .shiftAssignment(assignmentA1)
                .title("Complete checklist 2")
                .status(TaskStatus.COMPLETED)
                .priority(TaskPriority.NORMAL)
                .build());

        taskRepository.save(Task.builder()
                .shiftAssignment(assignmentA1)
                .title("Pending checklist 3")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .build());

        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.summary.totalTasks").value(3))
                .andExpect(jsonPath("$.data.summary.completedTasks").value(2))
                .andExpect(jsonPath("$.data.summary.pendingTasks").value(1));
    }

    // 17. Unresolved issue summary computation
    @Test
    void test17_UnresolvedIssueSummaryComputation() throws Exception {
        issueRepository.save(Issue.builder()
                .branch(branchA)
                .title("Fridge warm")
                .description("Temp reading 12C")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.HIGH)
                .status(IssueStatus.OPEN)
                .reportedBy(staffA1)
                .build());

        issueRepository.save(Issue.builder()
                .branch(branchA)
                .title("Ice machine leaking")
                .description("Filter loose")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.NORMAL)
                .status(IssueStatus.ASSIGNED)
                .reportedBy(staffA1)
                .build());

        issueRepository.save(Issue.builder()
                .branch(branchA)
                .title("Front door hinge repaired")
                .description("Tightened screws")
                .category(IssueCategory.MAINTENANCE)
                .priority(IssuePriority.LOW)
                .status(IssueStatus.RESOLVED)
                .reportedBy(staffA1)
                .build());

        mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                .header("Authorization", "Bearer " + staffA1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.summary.openBranchIssues").value(2));
    }

    // 18. Concurrent submission protection (@Version)
    @Test
    void test18_ConcurrentSubmissionProtection_VersionOptimisticLocking() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverIdStr = objectMapper.readTree(draftJson).path("data").path("id").asText();
        UUID handoverId = UUID.fromString(handoverIdStr);

        ShiftHandover handover = shiftHandoverRepository.findById(handoverId).orElseThrow();
        assertThat(handover.getVersion()).isNotNull();
    }

    // 19. Concurrent submit/edit protection
    @Test
    void test19_ConcurrentSubmitEditProtection() throws Exception {
        String draftJson = mockMvc.perform(post("/v1/shifts/{shiftId}/handover", morningShiftA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String handoverId = objectMapper.readTree(draftJson).path("data").path("id").asText();

        // Staff 1 submits handover
        mockMvc.perform(patch("/v1/handovers/{id}/submit", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk());

        // Concurrent edit attempt after submit must be rejected
        mockMvc.perform(put("/v1/handovers/{id}", handoverId)
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Attempt to edit after submit\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("INVALID_HANDOVER_STATE"));
    }
}
