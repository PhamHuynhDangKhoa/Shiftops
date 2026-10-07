package com.shiftops.task.service;

import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
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
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskTemplateRepository templateRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final UserRepository userRepository;
    private final BranchAccessService branchAccessService;
    private final Clock clock;

    @Transactional
    public List<TaskResponse> generateTasksFromTemplate(
            UUID shiftId,
            GenerateTasksRequest request,
            UserPrincipal principal) {

        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Cannot generate tasks for a completed shift");
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot generate tasks for a cancelled shift");
        }

        TaskTemplate template = templateRepository.findByIdWithItems(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("TaskTemplate", "id", request.getTemplateId()));

        if (!template.isActive()) {
            throw new BusinessRuleException("TEMPLATE_INACTIVE", "Cannot generate tasks from an inactive task template");
        }

        if (!template.getBranch().getId().equals(shift.getBranch().getId())) {
            throw new BusinessRuleException("BRANCH_MISMATCH", "Task template belongs to a different branch than the shift");
        }

        List<ShiftAssignment> targetAssignments = new ArrayList<>();
        if (request.getShiftAssignmentId() != null) {
            ShiftAssignment sa = shiftAssignmentRepository.findById(request.getShiftAssignmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", request.getShiftAssignmentId()));
            if (!sa.getShift().getId().equals(shiftId)) {
                throw new BusinessRuleException("ASSIGNMENT_MISMATCH", "Assignment does not belong to the specified shift");
            }
            targetAssignments.add(sa);
        } else {
            if (shift.getAssignments() == null || shift.getAssignments().isEmpty()) {
                throw new BusinessRuleException("NO_ASSIGNMENTS", "Shift has no staff assigned to generate tasks for");
            }
            targetAssignments.addAll(shift.getAssignments());
        }

        List<Task> createdTasks = new ArrayList<>();
        for (ShiftAssignment sa : targetAssignments) {
            for (TaskTemplateItem item : template.getItems()) {
                // Idempotent duplicate check
                if (!taskRepository.existsByShiftAssignmentIdAndTemplateItemId(sa.getId(), item.getId())) {
                    Task task = Task.builder()
                            .shiftAssignment(sa)
                            .templateItem(item)
                            .title(item.getTitle())
                            .description(item.getDescription())
                            .priority(item.getPriority())
                            .status(TaskStatus.TODO)
                            .dueTime(shift.getEndTime())
                            .build();

                    createdTasks.add(taskRepository.save(task));
                    log.info("Generated task '{}' for staff {} on shift {}", task.getTitle(), sa.getUser().getEmail(), shiftId);
                }
            }
        }

        // Return all tasks for the targeted assignments
        List<Task> allShiftTasks = taskRepository.findByShiftId(shiftId);
        return allShiftTasks.stream().map(TaskResponse::fromEntity).toList();
    }

    @Transactional
    public TaskResponse createAdHocTask(
            UUID assignmentId,
            CreateAdHocTaskRequest request,
            UserPrincipal principal) {

        ShiftAssignment sa = shiftAssignmentRepository.findByIdWithDetails(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", assignmentId));

        Shift shift = sa.getShift();
        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Cannot create task for a completed shift");
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot create task for a cancelled shift");
        }

        Task task = Task.builder()
                .shiftAssignment(sa)
                .templateItem(null)
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.NORMAL)
                .status(TaskStatus.TODO)
                .dueTime(request.getDueTime() != null ? request.getDueTime() : shift.getEndTime())
                .build();

        Task saved = taskRepository.save(task);
        log.info("Created ad-hoc task '{}' for staff {} on shift {}", saved.getTitle(), sa.getUser().getEmail(), shift.getId());
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTaskStatus(
            UUID taskId,
            UpdateTaskStatusRequest request,
            UserPrincipal principal) {

        Task task = taskRepository.findByIdWithDetails(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        ShiftAssignment sa = task.getShiftAssignment();
        Shift shift = sa.getShift();

        // Authorization check
        if (principal.isStaff()) {
            if (!sa.getUser().getId().equals(principal.getId())) {
                throw new AccessDeniedException("Staff members can only update their own assigned tasks");
            }
            if (request.getStatus() == TaskStatus.CANCELLED) {
                throw new AccessDeniedException("Staff members cannot cancel tasks");
            }
        } else {
            branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());
        }

        TaskStatus currentStatus = task.getStatus();
        TaskStatus targetStatus = request.getStatus();

        if (currentStatus == targetStatus) {
            return TaskResponse.fromEntity(task);
        }

        // State Machine validation
        if (currentStatus == TaskStatus.COMPLETED) {
            throw new BusinessRuleException("TASK_ALREADY_COMPLETED", "Completed task cannot be modified");
        }
        if (currentStatus == TaskStatus.CANCELLED) {
            throw new BusinessRuleException("TASK_CANCELLED", "Cancelled task cannot be modified");
        }

        boolean valid = false;
        switch (currentStatus) {
            case TODO -> valid = (targetStatus == TaskStatus.IN_PROGRESS || targetStatus == TaskStatus.COMPLETED || targetStatus == TaskStatus.CANCELLED);
            case IN_PROGRESS -> valid = (targetStatus == TaskStatus.COMPLETED || targetStatus == TaskStatus.CANCELLED || targetStatus == TaskStatus.TODO);
            default -> valid = false;
        }

        if (!valid) {
            throw new BusinessRuleException(
                    "INVALID_TASK_TRANSITION",
                    "Cannot transition task from " + currentStatus + " to " + targetStatus);
        }

        task.setStatus(targetStatus);

        if (targetStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(clock.instant());
            User completedByUser = userRepository.findById(principal.getId()).orElse(null);
            task.setCompletedBy(completedByUser);
        }

        Task saved = taskRepository.save(task);
        log.info("Task {} status changed: {} -> {} by {}", taskId, currentStatus, targetStatus, principal.getUsername());
        return TaskResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(UUID shiftId, TaskStatus status, UserPrincipal principal) {
        List<Task> tasks = taskRepository.findMyTasks(principal.getId(), shiftId, status);
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getBranchTasks(
            UUID branchId,
            UUID shiftId,
            UUID staffId,
            TaskStatus status,
            Instant startDate,
            Instant endDate,
            UserPrincipal principal) {

        branchAccessService.validateBranchAccess(principal, branchId);

        Instant effectiveStart = startDate != null ? startDate : Instant.EPOCH;
        Instant effectiveEnd = endDate != null ? endDate : Instant.now().plus(java.time.Duration.ofDays(36500));

        List<Task> tasks = taskRepository.findBranchTasks(branchId, shiftId, staffId, status, effectiveStart, effectiveEnd);
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getShiftTasks(UUID shiftId, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        List<Task> tasks = taskRepository.findByShiftId(shiftId);
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    @Transactional
    public void cancelIncompleteTasksForShift(UUID shiftId) {
        List<Task> incomplete = taskRepository.findByShiftIdAndStatusIn(
                shiftId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS));

        for (Task task : incomplete) {
            task.setStatus(TaskStatus.CANCELLED);
            taskRepository.save(task);
            log.info("Cancelled task {} due to shift {} cancellation", task.getId(), shiftId);
        }
    }
}
