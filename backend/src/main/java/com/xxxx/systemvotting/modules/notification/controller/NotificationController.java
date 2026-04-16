package com.xxxx.systemvotting.modules.notification.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.notification.dto.response.NotificationResponseDTO;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponseDTO>> getMyNotifications(@AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.valueOf(jwt.getSubject());
        List<NotificationResponseDTO> response = notificationService.getMyNotifications(userId);
        return ApiResponse.<List<NotificationResponseDTO>>builder()
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
