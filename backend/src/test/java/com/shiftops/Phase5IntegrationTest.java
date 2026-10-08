package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.dto.*;
import com.shiftops.task.entity.*;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase5IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private com.shiftops.attendance.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskTemplateRepository taskTemplateRepository;

    @Autowired
    private com.shiftops.notification.repository.NotificationRepository notificationRepository;

    @Autowired
    private com.shiftops.announcement.repository.AnnouncementRepository announcementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

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
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("System Owner")
                .role(Role.OWNER)
                .isActive(true)
                .build());

        managerA = userRepository.save(User.builder()
                .email("manager.alpha@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        managerB = userRepository.save(User.builder()
                .email("manager.beta@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Beta")
                .role(Role.MANAGER)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        staffA1 = userRepository.save(User.builder()
                .email("staff.alpha1@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Alpha 1")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffA2 = userRepository.save(User.builder()
                .email("staff.alpha2@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Alpha 2")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffB = userRepository.save(User.builder()
                .email("staff.beta@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Beta")
                .role(Role.STAFF)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        ownerToken = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(owner));
        managerAToken = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(managerA));
        managerBToken = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(managerB));
        staffA1Token = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(staffA1));
        staffA2Token = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(staffA2));
        staffBToken = jwtTokenProvider.generateToken(com.shiftops.common.security.UserPrincipal.create(staffB));
    }

    private Shift createTestShift(Branch branch, String name, User staff) {
        Shift shift = Shift.builder()
                .branch(branch)
                .name(name)
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.PUBLISHED)
                .assignments(new ArrayList<>())
                .build();
        shift = shiftRepository.save(shift);

        ShiftAssignment sa = ShiftAssignment.builder()
                .shift(shift)
                .user(staff)
                .assignedBy(managerA)
                .assignedAt(Instant.now())
                .build();
        sa = shiftAssignmentRepository.save(sa);
        shift.getAssignments().add(sa);
        return shift;
    }

    // =========================================================================
    // 1. Task Template CRUD & Branch Scoping
    // =========================================================================

    @Test
    void testCreateTaskTemplate_Success() throws Exception {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder()
                .name("Morning Opening Routine")
                .description("Checklist for store opening")
                .items(List.of(
                        CreateTaskTemplateItemRequest.builder().title("Unlock doors").priority(TaskPriority.HIGH).orderIndex(0).build(),
                        CreateTaskTemplateItemRequest.builder().title("Count cash drawer").priority(TaskPriority.HIGH).orderIndex(1).build(),
                        CreateTaskTemplateItemRequest.builder().title("Turn on POS").priority(TaskPriority.NORMAL).orderIndex(2).build()
                ))
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchA.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Morning Opening Routine"))
                .andExpect(jsonPath("$.data.items", hasSize(3)))
                .andExpect(jsonPath("$.data.items[0].title").value("Unlock doors"));
    }

    @Test
    void testCreateTaskTemplate_DuplicateName_ReturnsConflict() throws Exception {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder()
                .name("Standard Routine")
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchA.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Second attempt with same name in same branch
        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchA.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void testManagerBranchIsolation_OnTemplates() throws Exception {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder().name("Routine").build();

        // Manager A tries to create template in Branch B -> 403 Forbidden
        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchB.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Staff tries to create template -> 403 Forbidden
        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchA.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Owner can create template in Branch B
        mockMvc.perform(post("/v1/branches/{branchId}/task-templates", branchB.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    void testUpdateTemplate_And_StatusToggle() throws Exception {
        TaskTemplate template = taskTemplateRepository.save(TaskTemplate.builder()
                .branch(branchA)
                .name("Old Template")
                .isActive(true)
                .items(new ArrayList<>())
                .build());

        UpdateTaskTemplateRequest updateReq = UpdateTaskTemplateRequest.builder()
                .name("Updated Template")
                .description("Updated notes")
                .items(List.of(CreateTaskTemplateItemRequest.builder().title("Item 1").build()))
                .build();

        mockMvc.perform(put("/v1/task-templates/{id}", template.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Template"))
                .andExpect(jsonPath("$.data.items", hasSize(1)));

        // Toggle inactive
        UpdateTaskTemplateStatusRequest statusReq = UpdateTaskTemplateStatusRequest.builder().active(false).build();
        mockMvc.perform(patch("/v1/task-templates/{id}/status", template.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));
    }

    // =========================================================================
    // 2. Task Generation & Duplicate Prevention
    // =========================================================================

    @Test
    void testGenerateTasks_Success_And_DuplicatePrevention() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);

        TaskTemplate template = TaskTemplate.builder()
                .branch(branchA)
                .name("Daily Checklist")
                .isActive(true)
                .items(new ArrayList<>())
                .build();
        TaskTemplateItem item1 = TaskTemplateItem.builder().template(template).title("Item A").priority(TaskPriority.HIGH).build();
        TaskTemplateItem item2 = TaskTemplateItem.builder().template(template).title("Item B").priority(TaskPriority.NORMAL).build();
        template.addItem(item1);
        template.addItem(item2);
        template = taskTemplateRepository.save(template);

        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(template.getId()).build();

        // First generation -> creates 2 tasks
        mockMvc.perform(post("/v1/shifts/{shiftId}/tasks/generate", shift.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].status").value("TODO"));

        assertThat(taskRepository.count()).isEqualTo(2);

        // Second generation call -> Idempotent! Does not duplicate tasks
        mockMvc.perform(post("/v1/shifts/{shiftId}/tasks/generate", shift.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        assertThat(taskRepository.count()).isEqualTo(2);
    }

    @Test
    void testGenerateTasks_BranchMismatch_ReturnsUnprocessableEntity() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);

        // Template in Branch B
        TaskTemplate templateB = taskTemplateRepository.save(TaskTemplate.builder()
                .branch(branchB)
                .name("Beta Template")
                .isActive(true)
                .items(new ArrayList<>())
                .build());

        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(templateB.getId()).build();

        mockMvc.perform(post("/v1/shifts/{shiftId}/tasks/generate", shift.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.message").value(containsString("different branch")));
    }

    // =========================================================================
    // 3. Staff Task Workflow & Lifecycle Transitions
    // =========================================================================

    @Test
    void testStaffTaskLifecycle_Todo_To_InProgress_To_Completed() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        Task task = taskRepository.save(Task.builder()
                .shiftAssignment(sa)
                .title("Clean Display")
                .priority(TaskPriority.NORMAL)
                .status(TaskStatus.TODO)
                .build());

        // 1. Staff queries my tasks
        mockMvc.perform(get("/v1/tasks/my")
                        .header("Authorization", "Bearer " + staffA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(task.getId().toString()))
                .andExpect(jsonPath("$.data[0].status").value("TODO"));

        // 2. Staff transitions TODO -> IN_PROGRESS
        mockMvc.perform(patch("/v1/tasks/{id}/status", task.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateTaskStatusRequest.builder().status(TaskStatus.IN_PROGRESS).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.completedAt").doesNotExist());

        // 3. Staff transitions IN_PROGRESS -> COMPLETED
        mockMvc.perform(patch("/v1/tasks/{id}/status", task.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateTaskStatusRequest.builder().status(TaskStatus.COMPLETED).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.completedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.completedById").value(staffA1.getId().toString()));

        // 4. Invalid transition: COMPLETED -> TODO (422 Unprocessable Entity)
        mockMvc.perform(patch("/v1/tasks/{id}/status", task.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateTaskStatusRequest.builder().status(TaskStatus.TODO).build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.message").value(containsString("Completed task cannot be modified")));
    }

    @Test
    void testStaffCannotModifyOtherStaffTask() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        Task taskA1 = taskRepository.save(Task.builder()
                .shiftAssignment(sa)
                .title("Staff A1 Task")
                .priority(TaskPriority.NORMAL)
                .status(TaskStatus.TODO)
                .build());

        // Staff A2 tries to update Staff A1's task -> 403 Forbidden
        mockMvc.perform(patch("/v1/tasks/{id}/status", taskA1.getId())
                        .header("Authorization", "Bearer " + staffA2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateTaskStatusRequest.builder().status(TaskStatus.IN_PROGRESS).build())))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStaffCannotCancelTask() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        Task task = taskRepository.save(Task.builder()
                .shiftAssignment(sa)
                .title("Task")
                .priority(TaskPriority.NORMAL)
                .status(TaskStatus.TODO)
                .build());

        // Staff tries to set CANCELLED -> 403 Forbidden
        mockMvc.perform(patch("/v1/tasks/{id}/status", task.getId())
                        .header("Authorization", "Bearer " + staffA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateTaskStatusRequest.builder().status(TaskStatus.CANCELLED).build())))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. Edge Cases: Shift Cancellation & Assignment Protection
    // =========================================================================

    @Test
    void testShiftCancellation_CancelsIncompleteTasks_PreservesCompleted() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        Task t1 = taskRepository.save(Task.builder().shiftAssignment(sa).title("T1").status(TaskStatus.TODO).build());
        Task t2 = taskRepository.save(Task.builder().shiftAssignment(sa).title("T2").status(TaskStatus.IN_PROGRESS).build());
        Task t3 = taskRepository.save(Task.builder().shiftAssignment(sa).title("T3").status(TaskStatus.COMPLETED).completedAt(Instant.now()).build());

        // Cancel shift
        mockMvc.perform(patch("/v1/shifts/{id}/status", shift.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CANCELLED\"}"))
                .andExpect(status().isOk());

        assertThat(taskRepository.findById(t1.getId()).get().getStatus()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(taskRepository.findById(t2.getId()).get().getStatus()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(taskRepository.findById(t3.getId()).get().getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    void testRemoveAssignmentWithCompletedTasks_IsRejected() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        taskRepository.save(Task.builder()
                .shiftAssignment(sa)
                .title("Finished Task")
                .status(TaskStatus.COMPLETED)
                .completedAt(Instant.now())
                .build());

        // Manager tries to remove assignment -> 422 Unprocessable Entity
        mockMvc.perform(delete("/v1/shifts/{id}/assignments/{userId}", shift.getId(), staffA1.getId())
                        .header("Authorization", "Bearer " + managerAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.message").value(containsString("completed tasks")));
    }

    @Test
    void testTemplateModification_DoesNotMutateHistoricalTasks() throws Exception {
        Shift shift = createTestShift(branchA, "Morning Shift", staffA1);

        TaskTemplate template = TaskTemplate.builder()
                .branch(branchA)
                .name("Original Template")
                .isActive(true)
                .items(new ArrayList<>())
                .build();
        TaskTemplateItem item = TaskTemplateItem.builder().template(template).title("Original Title").description("Original Desc").build();
        template.addItem(item);
        template = taskTemplateRepository.save(template);

        // Generate tasks
        mockMvc.perform(post("/v1/shifts/{shiftId}/tasks/generate", shift.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(GenerateTasksRequest.builder().templateId(template.getId()).build())))
                .andExpect(status().isOk());

        Task generatedTask = taskRepository.findAll().get(0);
        assertThat(generatedTask.getTitle()).isEqualTo("Original Title");

        // Now update template item title
        UpdateTaskTemplateRequest updateReq = UpdateTaskTemplateRequest.builder()
                .name("Original Template")
                .items(List.of(CreateTaskTemplateItemRequest.builder().title("Brand New Rewritten Title").build()))
                .build();

        mockMvc.perform(put("/v1/task-templates/{id}", template.getId())
                        .header("Authorization", "Bearer " + managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Verify previously generated task still has original title!
        Task historicalTask = taskRepository.findById(generatedTask.getId()).get();
        assertThat(historicalTask.getTitle()).isEqualTo("Original Title");
    }
}
