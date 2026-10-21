package com.shiftops.issue.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.issue.dto.*;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping("/issues")
    public ResponseEntity<ApiResponse<IssueResponse>> createIssue(
            @Valid @RequestBody CreateIssueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueResponse response = issueService.createIssue(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Issue reported successfully"));
    }

    @GetMapping("/issues/my")
    public ResponseEntity<ApiResponse<List<IssueResponse>>> getMyIssues(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<IssueResponse> response = issueService.getMyIssues(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/branches/{branchId}/issues")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<IssueResponse>>> getBranchIssues(
            @PathVariable UUID branchId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) IssueCategory category,
            @RequestParam(required = false) UUID assignedToId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IssueResponse> responsePage = issueService.getBranchIssues(BranchIssuesQuery.builder()
                .branchId(branchId)
                .status(status)
                .priority(priority)
                .category(category)
                .assignedToId(assignedToId)
                .pageable(pageable)
                .principal(principal)
                .build());

        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(responsePage)));
    }

    @GetMapping("/branches/{branchId}/issues/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<IssueSummaryResponse>> getBranchSummary(
            @PathVariable UUID branchId,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueSummaryResponse response = issueService.getBranchSummary(branchId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/issues/{id}")
    public ResponseEntity<ApiResponse<IssueResponse>> getIssueById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueResponse response = issueService.getIssueById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/issues/{id}/assign")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<IssueResponse>> assignIssue(
            @PathVariable UUID id,
            @RequestBody AssignIssueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueResponse response = issueService.assignIssue(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Issue assignment updated successfully"));
    }

    @PatchMapping("/issues/{id}/status")
    public ResponseEntity<ApiResponse<IssueResponse>> updateIssueStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIssueStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueResponse response = issueService.updateIssueStatus(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Issue status updated successfully"));
    }

    @PostMapping("/issues/{id}/comments")
    public ResponseEntity<ApiResponse<IssueCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateIssueCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueCommentResponse response = issueService.addComment(id, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Comment added successfully"));
    }

    @PostMapping(value = "/issues/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IssueAttachmentResponse>> addAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueAttachmentResponse response = issueService.addAttachment(id, file, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Attachment uploaded successfully"));
    }

    @GetMapping("/issues/{id}/attachments/{attachmentId}/file")
    public ResponseEntity<Resource> getAttachmentFile(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        IssueService.AttachmentFile file = issueService.getAttachmentFile(id, attachmentId, principal);
        String safeFilename = file.originalFileName().replaceAll("[\\r\\n\"\\\\]", "_");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(file.resource());
    }
}
