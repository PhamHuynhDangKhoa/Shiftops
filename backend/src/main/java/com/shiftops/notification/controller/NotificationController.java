package com.shiftops.notification.controller;

import com.shiftops.common.dto.ApiResponse;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.notification.dto.UnreadCountResponse;
import com.shiftops.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Operational notifications and inbox management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "View current authenticated user's notifications inbox")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationResponse> responsePage = notificationService.getMyNotifications(principal, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(responsePage)));
    }

    @Operation(summary = "Get current user's unread notification count")
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        UnreadCountResponse count = notificationService.getUnreadCount(principal);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @Operation(summary = "Mark a single notification as read")
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationResponse response = notificationService.markAsRead(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Notification marked as read"));
    }

    @Operation(summary = "Mark all notifications as read for current user")
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        int count = notificationService.markAllAsRead(principal);
        return ResponseEntity.ok(ApiResponse.success(count, "Marked " + count + " notifications as read"));
    }
}
