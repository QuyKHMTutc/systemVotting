package com.xxxx.systemvotting.modules.notification.service.impl;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.notification.dto.response.NotificationResponseDTO;
import com.xxxx.systemvotting.modules.notification.entity.Notification;
import com.xxxx.systemvotting.modules.notification.repository.NotificationRepository;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void createNotification(Long recipientId, String actorName, String actorAvatar, String type, String message, Long relatedPollId, Long relatedCommentId) {
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) return;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actorName(actorName != null ? actorName : "Ẩn danh")
                .actorAvatar(actorAvatar)
                .type(type)
                .message(message)
                .relatedPollId(relatedPollId)
                .relatedCommentId(relatedCommentId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // Map to DTO and push via WebSocket
        NotificationResponseDTO dto = mapToDTO(notification);
        
        // This pushes to /user/{userId}/queue/notifications using Spring's default user destination prefix
        messagingTemplate.convertAndSendToUser(
                recipient.getId().toString(), 
                "/queue/notifications", 
                dto
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByRecipientId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    private NotificationResponseDTO mapToDTO(Notification notification) {
        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .actorName(notification.getActorName())
                .actorAvatar(notification.getActorAvatar())
                .type(notification.getType())
                .message(notification.getMessage())
                .relatedPollId(notification.getRelatedPollId())
                .relatedCommentId(notification.getRelatedCommentId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
