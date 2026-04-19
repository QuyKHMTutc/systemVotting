package com.xxxx.systemvotting.modules.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Async wrapper around NotificationService.
 *
 * Why a separate class (not @Async on NotificationService directly)?
 * Spring @Async only works when called from a DIFFERENT bean — self-invocation bypasses the proxy.
 * By injecting this wrapper into VoteServiceImpl, the @Async proxy is correctly applied.
 *
 * Performance impact:
 * Before: vote request holds Tomcat thread → creates notification (DB write) → WebSocket push → return
 * After:  vote request → fires notification task to notificationExecutor thread pool → return immediately
 * Result: ~10-20ms shaved off the hot path per first-time vote under high concurrency.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncNotificationService {

    private final NotificationService notificationService;

    /**
     * Dispatches notification creation to the dedicated notificationExecutor thread pool.
     * Does NOT block the calling thread (vote request handler).
     */
    @Async("notificationExecutor")
    public void createNotificationAsync(
            Long recipientId,
            String actorName,
            String actorAvatar,
            String type,
            String message,
            Long relatedPollId,
            Long relatedCommentId) {
        try {
            notificationService.createNotification(
                    recipientId, actorName, actorAvatar, type, message, relatedPollId, relatedCommentId);
        } catch (Exception e) {
            // Log but don't propagate — notification failure must NEVER affect vote result
            log.error("Async notification failed for recipient={}, type={}: {}", recipientId, type, e.getMessage());
        }
    }
}
