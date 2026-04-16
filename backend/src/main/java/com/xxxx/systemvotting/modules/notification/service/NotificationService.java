package com.xxxx.systemvotting.modules.notification.service;

import com.xxxx.systemvotting.modules.notification.dto.response.NotificationResponseDTO;
import java.util.List;

public interface NotificationService {
    void createNotification(Long recipientId, String actorName, String actorAvatar, String type, String message, Long relatedPollId, Long relatedCommentId);
    
    List<NotificationResponseDTO> getMyNotifications(Long userId);
    
    void markAsRead(Long notificationId, Long userId);
    
    void markAllAsRead(Long userId);
    
    long getUnreadCount(Long userId);
}
