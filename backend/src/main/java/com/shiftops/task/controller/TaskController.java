package com.shiftops.task.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.task.dto.CreateAdHocTaskRequest;
import com.shiftops.task.dto.GenerateTasksRequest;
import com.shiftops.task.dto.TaskResponse;
import com.shiftops.task.dto.UpdateTaskStatusRequest;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Shift-bound operational tasks and checklist APIs")
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Generate tasks for a shift from a task template")
    @PostMapping("/shifts/{shiftId}/tasks/generate")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> generateTasks(
            @PathVariable UUID shiftId,
            @Valid @RequestBody GenerateTasksRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> responses = taskService.generateTasksFromTemplate(shiftId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(responses, "Tasks generated successfully"));
    }

    @Operation(summary = "Create an ad-hoc task for a specific shift assignment")
    @PostMapping("/shift-assignments/{assignmentId}/tasks")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskResponse>> createAdHocTask(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody CreateAdHocTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskResponse response = taskService.createAdHocTask(assignmentId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Task created successfully"));
    }

    @Operation(summary = "Get tasks assigned to current staff user")
    @GetMapping("/tasks/my")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(
            @RequestParam(required = false) UUID shiftId,
            @RequestParam(required = false) TaskStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> responses = taskService.getMyTasks(shiftId, status, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @Operation(summary = "Update task status (TODO -> IN_PROGRESS -> COMPLETED)")
    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskResponse response = taskService.updateTaskStatus(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Task status updated successfully"));
    }

    @Operation(summary = "Monitor branch tasks (Manager/Owner)")
    @GetMapping("/branches/{branchId}/tasks")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getBranchTasks(
            @PathVariable UUID branchId,
            @RequestParam(required = false) UUID shiftId,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> responses = taskService.getBranchTasks(branchId, shiftId, staffId, status, startDate, endDate, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @Operation(summary = "Get all tasks for a specific shift")
    @GetMapping("/shifts/{shiftId}/tasks")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getShiftTasks(
            @PathVariable UUID shiftId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> responses = taskService.getShiftTasks(shiftId, principal);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
