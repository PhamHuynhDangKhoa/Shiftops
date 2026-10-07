package com.shiftops.task.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.user.service.BranchAccessService;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.dto.CreateAdHocTaskRequest;
import com.shiftops.task.dto.GenerateTasksRequest;
import com.shiftops.task.dto.TaskResponse;
import com.shiftops.task.dto.UpdateTaskStatusRequest;
import com.shiftops.task.entity.*;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskTemplateRepository templateRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @Mock
    private Clock clock;

    @InjectMocks
    private TaskService taskService;

    private final Instant fixedTime = Instant.parse("2026-10-10T09:00:00Z");
    private Branch branchA;
    private Branch branchB;
    private User staff1;
    private User staff2;
    private User managerA;
    private UserPrincipal staff1Principal;
    private UserPrincipal staff2Principal;
    private UserPrincipal managerAPrincipal;
    private Shift shift1;
    private ShiftAssignment assignment1;
    private TaskTemplate template1;
    private TaskTemplateItem item1;
    private TaskTemplateItem item2;

    @BeforeEach
    void setUp() {
        branchA = Branch.builder().name("Branch Alpha").isActive(true).build();
        branchA.setId(UUID.randomUUID());

        branchB = Branch.builder().name("Branch Beta").isActive(true).build();
        branchB.setId(UUID.randomUUID());

        managerA = User.builder().email("mgr@shiftops.com").fullName("Manager A").role(Role.MANAGER).primaryBranch(branchA).isActive(true).build();
        managerA.setId(UUID.randomUUID());
        managerAPrincipal = UserPrincipal.create(managerA);

        staff1 = User.builder().email("staff1@shiftops.com").fullName("Staff One").role(Role.STAFF).primaryBranch(branchA).isActive(true).build();
        staff1.setId(UUID.randomUUID());
        staff1Principal = UserPrincipal.create(staff1);

        staff2 = User.builder().email("staff2@shiftops.com").fullName("Staff Two").role(Role.STAFF).primaryBranch(branchA).isActive(true).build();
        staff2.setId(UUID.randomUUID());
        staff2Principal = UserPrincipal.create(staff2);

        shift1 = Shift.builder()
                .branch(branchA)
                .name("Morning Shift")
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.PUBLISHED)
                .assignments(new ArrayList<>())
                .build();
        shift1.setId(UUID.randomUUID());

        assignment1 = ShiftAssignment.builder()
                .shift(shift1)
                .user(staff1)
                .assignedAt(Instant.now())
                .build();
        assignment1.setId(UUID.randomUUID());
        shift1.getAssignments().add(assignment1);

        template1 = TaskTemplate.builder()
                .branch(branchA)
                .name("Opening Checklist")
                .isActive(true)
                .items(new ArrayList<>())
                .build();
        template1.setId(UUID.randomUUID());

        item1 = TaskTemplateItem.builder().template(template1).title("Open Store").priority(TaskPriority.HIGH).orderIndex(0).build();
        item1.setId(UUID.randomUUID());

        item2 = TaskTemplateItem.builder().template(template1).title("Check Stock").priority(TaskPriority.NORMAL).orderIndex(1).build();
        item2.setId(UUID.randomUUID());

        template1.addItem(item1);
        template1.addItem(item2);
    }

    @Test
    void testGenerateTasks_Success() {
        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(template1.getId()).build();

        when(shiftRepository.findByIdWithDetails(shift1.getId())).thenReturn(Optional.of(shift1));
        when(templateRepository.findByIdWithItems(template1.getId())).thenReturn(Optional.of(template1));
        when(taskRepository.existsByShiftAssignmentIdAndTemplateItemId(assignment1.getId(), item1.getId())).thenReturn(false);
        when(taskRepository.existsByShiftAssignmentIdAndTemplateItemId(assignment1.getId(), item2.getId())).thenReturn(false);

        Task t1 = Task.builder().shiftAssignment(assignment1).templateItem(item1).title("Open Store").priority(TaskPriority.HIGH).status(TaskStatus.TODO).build();
        t1.setId(UUID.randomUUID());
        Task t2 = Task.builder().shiftAssignment(assignment1).templateItem(item2).title("Check Stock").priority(TaskPriority.NORMAL).status(TaskStatus.TODO).build();
        t2.setId(UUID.randomUUID());

        when(taskRepository.save(any(Task.class))).thenReturn(t1, t2);
        when(taskRepository.findByShiftId(shift1.getId())).thenReturn(List.of(t1, t2));

        List<TaskResponse> res = taskService.generateTasksFromTemplate(shift1.getId(), req, managerAPrincipal);

        assertThat(res).hasSize(2);
        verify(taskRepository, times(2)).save(any(Task.class));
    }

    @Test
    void testGenerateTasks_DuplicatePrevention_Idempotent() {
        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(template1.getId()).build();

        when(shiftRepository.findByIdWithDetails(shift1.getId())).thenReturn(Optional.of(shift1));
        when(templateRepository.findByIdWithItems(template1.getId())).thenReturn(Optional.of(template1));
        // item1 already exists, item2 does not
        when(taskRepository.existsByShiftAssignmentIdAndTemplateItemId(assignment1.getId(), item1.getId())).thenReturn(true);
        when(taskRepository.existsByShiftAssignmentIdAndTemplateItemId(assignment1.getId(), item2.getId())).thenReturn(false);

        Task t2 = Task.builder().shiftAssignment(assignment1).templateItem(item2).title("Check Stock").priority(TaskPriority.NORMAL).status(TaskStatus.TODO).build();
        t2.setId(UUID.randomUUID());
        when(taskRepository.save(any(Task.class))).thenReturn(t2);
        when(taskRepository.findByShiftId(shift1.getId())).thenReturn(List.of(t2));

        List<TaskResponse> res = taskService.generateTasksFromTemplate(shift1.getId(), req, managerAPrincipal);

        assertThat(res).hasSize(1);
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void testGenerateTasks_InactiveTemplate_ThrowsBusinessRuleException() {
        template1.setActive(false);
        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(template1.getId()).build();

        when(shiftRepository.findByIdWithDetails(shift1.getId())).thenReturn(Optional.of(shift1));
        when(templateRepository.findByIdWithItems(template1.getId())).thenReturn(Optional.of(template1));

        assertThatThrownBy(() -> taskService.generateTasksFromTemplate(shift1.getId(), req, managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void testGenerateTasks_BranchMismatch_ThrowsBusinessRuleException() {
        template1.setBranch(branchB); // Template belongs to Branch B, Shift belongs to Branch A
        GenerateTasksRequest req = GenerateTasksRequest.builder().templateId(template1.getId()).build();

        when(shiftRepository.findByIdWithDetails(shift1.getId())).thenReturn(Optional.of(shift1));
        when(templateRepository.findByIdWithItems(template1.getId())).thenReturn(Optional.of(template1));

        assertThatThrownBy(() -> taskService.generateTasksFromTemplate(shift1.getId(), req, managerAPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("different branch");
    }

    @Test
    void testCreateAdHocTask_Success() {
        CreateAdHocTaskRequest req = CreateAdHocTaskRequest.builder()
                .title("Special Cleanup")
                .description("Clean back room")
                .priority(TaskPriority.HIGH)
                .build();

        when(shiftAssignmentRepository.findByIdWithDetails(assignment1.getId())).thenReturn(Optional.of(assignment1));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse res = taskService.createAdHocTask(assignment1.getId(), req, managerAPrincipal);

        assertThat(res).isNotNull();
        assertThat(res.getTitle()).isEqualTo("Special Cleanup");
        assertThat(res.getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void testUpdateTaskStatus_TodoToInProgress_Success() {
        Task task = Task.builder()
                .shiftAssignment(assignment1)
                .title("Task 1")
                .status(TaskStatus.TODO)
                .build();
        task.setId(UUID.randomUUID());

        when(taskRepository.findByIdWithDetails(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskStatusRequest req = UpdateTaskStatusRequest.builder().status(TaskStatus.IN_PROGRESS).build();
        TaskResponse res = taskService.updateTaskStatus(task.getId(), req, staff1Principal);

        assertThat(res.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    void testUpdateTaskStatus_InProgressToCompleted_RecordsTimestamp() {
        Task task = Task.builder()
                .shiftAssignment(assignment1)
                .title("Task 1")
                .status(TaskStatus.IN_PROGRESS)
                .build();
        task.setId(UUID.randomUUID());

        when(clock.instant()).thenReturn(fixedTime);
        when(userRepository.findById(staff1.getId())).thenReturn(Optional.of(staff1));
        when(taskRepository.findByIdWithDetails(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskStatusRequest req = UpdateTaskStatusRequest.builder().status(TaskStatus.COMPLETED).build();
        TaskResponse res = taskService.updateTaskStatus(task.getId(), req, staff1Principal);

        assertThat(res.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(res.getCompletedAt()).isEqualTo(fixedTime);
        assertThat(res.getCompletedById()).isEqualTo(staff1.getId());
    }

    @Test
    void testUpdateTaskStatus_CompletedToTodo_ThrowsBusinessRuleException() {
        Task task = Task.builder()
                .shiftAssignment(assignment1)
                .title("Task 1")
                .status(TaskStatus.COMPLETED)
                .completedAt(fixedTime)
                .build();
        task.setId(UUID.randomUUID());

        when(taskRepository.findByIdWithDetails(task.getId())).thenReturn(Optional.of(task));

        UpdateTaskStatusRequest req = UpdateTaskStatusRequest.builder().status(TaskStatus.TODO).build();
        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), req, staff1Principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Completed task cannot be modified");
    }

    @Test
    void testUpdateTaskStatus_StaffUpdatingOtherStaffTask_ThrowsAccessDeniedException() {
        Task task = Task.builder()
                .shiftAssignment(assignment1) // assigned to staff1
                .title("Task 1")
                .status(TaskStatus.TODO)
                .build();
        task.setId(UUID.randomUUID());

        when(taskRepository.findByIdWithDetails(task.getId())).thenReturn(Optional.of(task));

        UpdateTaskStatusRequest req = UpdateTaskStatusRequest.builder().status(TaskStatus.IN_PROGRESS).build();
        // staff2 tries to update staff1's task
        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), req, staff2Principal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("only update their own assigned tasks");
    }

    @Test
    void testUpdateTaskStatus_StaffCancellingTask_ThrowsAccessDeniedException() {
        Task task = Task.builder()
                .shiftAssignment(assignment1)
                .title("Task 1")
                .status(TaskStatus.TODO)
                .build();
        task.setId(UUID.randomUUID());

        when(taskRepository.findByIdWithDetails(task.getId())).thenReturn(Optional.of(task));

        UpdateTaskStatusRequest req = UpdateTaskStatusRequest.builder().status(TaskStatus.CANCELLED).build();
        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), req, staff1Principal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("cannot cancel tasks");
    }

    @Test
    void testCancelIncompleteTasksForShift_Success() {
        Task t1 = Task.builder().shiftAssignment(assignment1).title("T1").status(TaskStatus.TODO).build();
        Task t2 = Task.builder().shiftAssignment(assignment1).title("T2").status(TaskStatus.IN_PROGRESS).build();

        when(taskRepository.findByShiftIdAndStatusIn(eq(shift1.getId()), any()))
                .thenReturn(List.of(t1, t2));

        taskService.cancelIncompleteTasksForShift(shift1.getId());

        assertThat(t1.getStatus()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(t2.getStatus()).isEqualTo(TaskStatus.CANCELLED);
        verify(taskRepository, times(2)).save(any(Task.class));
    }
}
