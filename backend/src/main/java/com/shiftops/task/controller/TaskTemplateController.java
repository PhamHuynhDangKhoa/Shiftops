package com.shiftops.task.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.task.dto.CreateTaskTemplateRequest;
import com.shiftops.task.dto.TaskTemplateResponse;
import com.shiftops.task.dto.UpdateTaskTemplateRequest;
import com.shiftops.task.dto.UpdateTaskTemplateStatusRequest;
import com.shiftops.task.service.TaskTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Task Templates", description = "Branch-scoped operational task template APIs")
public class TaskTemplateController {

    private final TaskTemplateService taskTemplateService;

    @Operation(summary = "Create task template for a branch")
    @PostMapping("/branches/{branchId}/task-templates")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskTemplateResponse>> createTemplate(
            @PathVariable UUID branchId,
            @Valid @RequestBody CreateTaskTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskTemplateResponse response = taskTemplateService.createTemplate(branchId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Task template created successfully"));
    }

    @Operation(summary = "List task templates for a branch")
    @GetMapping("/branches/{branchId}/task-templates")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<TaskTemplateResponse>>> getBranchTemplates(
            @PathVariable UUID branchId,
            @RequestParam(required = false) Boolean active,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskTemplateResponse> response = taskTemplateService.getBranchTemplates(branchId, active, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get task template by ID")
    @GetMapping("/task-templates/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskTemplateResponse>> getTemplateById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskTemplateResponse response = taskTemplateService.getTemplateById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update task template")
    @PutMapping("/task-templates/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskTemplateResponse response = taskTemplateService.updateTemplate(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Task template updated successfully"));
    }

    @Operation(summary = "Toggle active status of a task template")
    @PatchMapping("/task-templates/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskTemplateResponse>> updateTemplateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskTemplateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskTemplateResponse response = taskTemplateService.updateTemplateStatus(id, request.getActive(), principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Task template status updated successfully"));
    }
}
