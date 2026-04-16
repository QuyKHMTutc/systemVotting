package com.xxxx.systemvotting.modules.notification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private String actorName;
    private String actorAvatar;
    private String type;
    private String message;
    private Long relatedPollId;
    private Long relatedCommentId;
    
    @JsonProperty("isRead")
    private boolean isRead;
    
    private LocalDateTime createdAt;
}
