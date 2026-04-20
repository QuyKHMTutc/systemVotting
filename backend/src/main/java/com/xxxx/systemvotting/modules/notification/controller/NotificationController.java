package com.xxxx.systemvotting.modules.notification.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.notification.dto.response.NotificationResponseDTO;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponseDTO>> getMyNotifications(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        PageResponse<NotificationResponseDTO> response = notificationService.getMyNotifications(userId, page, size);
        return ApiResponse.<PageResponse<NotificationResponseDTO>>builder()
                .code(200)
                .message("Notifications retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        Long response = notificationService.getUnreadCount(userId);
        return ApiResponse.<Long>builder()
                .code(200)
                .message("Unread count retrieved successfully")
                .data(response)
                .build();
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        notificationService.markAsRead(id, userId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Notification marked as read")
                .data(null)
                .build();
    }

    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        notificationService.markAllAsRead(userId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("All notifications marked as read")
                .data(null)
                .build();
    }
}
