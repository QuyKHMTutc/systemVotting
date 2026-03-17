package com.xxxx.systemvotting.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * DTO for encapsulating real-time WebSocket messages that are broadcasted
 * across multiple server instances via Redis Pub/Sub.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealTimeMessageDTO implements Serializable {
    private String destination;
    private Object payload;
    private String targetUsername; // Used if it's a private message. Null for broadcasts.
}
