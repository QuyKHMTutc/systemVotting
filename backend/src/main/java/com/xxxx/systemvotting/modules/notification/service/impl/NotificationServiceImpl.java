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
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    @CacheEvict(value = "notifUnreadCount", key = "#recipientId")
    public void createNotification(Long recipientId, String actorName, String actorAvatar, String type, String message, Long relatedPollId, Long relatedCommentId) {
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) {
            log.debug("Skip notification for missing recipientId={}", recipientId);
            return;
        }

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
    @CacheEvict(value = "notifUnreadCount", key = "#userId")
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
    @CacheEvict(value = "notifUnreadCount", key = "#userId")
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByRecipientId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "notifUnreadCount", key = "#userId")
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    private NotificationResponseDTO mapToDTO(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getActorName(),
                notification.getActorAvatar(),
                notification.getType(),
                notification.getMessage(),
                notification.getRelatedPollId(),
                notification.getRelatedCommentId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
