package com.xxxx.systemvotting.config;

import com.xxxx.systemvotting.common.dto.RealTimeMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Subscribes to the central Redis Pub/Sub channel and bridges messages
 * over to the local STOMP WebSockets connected to this specific instance.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * This method is invoked by the Spring Data Redis MessageListenerAdapter.
     */
    public void handleMessage(RealTimeMessageDTO message) {
        log.debug("Received message from Redis Pub/Sub: {}", message);
        
        try {
            if (message.getTargetUsername() != null) {
                // Private message
                messagingTemplate.convertAndSendToUser(
                        message.getTargetUsername(),
                        message.getDestination(),
                        message.getPayload()
                );
            } else {
                // Broadcast message
                messagingTemplate.convertAndSend(message.getDestination(), message.getPayload());
            }
        } catch (Exception e) {
            log.error("Failed to broadcast message from Redis to WebSocket", e);
        }
    }
}
