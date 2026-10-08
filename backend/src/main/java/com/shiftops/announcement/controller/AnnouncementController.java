package com.shiftops.announcement.controller;

import com.shiftops.announcement.dto.AnnouncementResponse;
import com.shiftops.announcement.dto.CreateAnnouncementRequest;
import com.shiftops.announcement.service.AnnouncementService;
import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@Tag(name = "Announcements", description = "Operational branch and organization announcements APIs")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @Operation(summary = "Create an announcement for a branch or organization")
    @PostMapping("/branches/{branchId}/announcements")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @PathVariable UUID branchId,
            @Valid @RequestBody CreateAnnouncementRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnnouncementResponse response = announcementService.createAnnouncement(branchId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Announcement created successfully"));
    }

    @Operation(summary = "List all announcements for a branch")
    @GetMapping("/branches/{branchId}/announcements")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<AnnouncementResponse>>> getBranchAnnouncements(
            @PathVariable UUID branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AnnouncementResponse> pageResponse = announcementService.getBranchAnnouncements(branchId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(pageResponse)));
    }

    @Operation(summary = "Get active announcements relevant to the current user")
    @GetMapping("/announcements/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getMyAnnouncements(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AnnouncementResponse> response = announcementService.getMyAnnouncements(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Publish a draft announcement")
    @PostMapping("/announcements/{id}/publish")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> publishAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnnouncementResponse response = announcementService.publishAnnouncement(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Announcement published successfully"));
    }
}
