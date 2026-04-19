package com.xxxx.systemvotting.modules.notification.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record NotificationResponseDTO(

    Long id,
    String actorName,
    String actorAvatar,
    String type,
    String message,
    Long relatedPollId,
    Long relatedCommentId,

    @JsonProperty("isRead")
    boolean isRead,

    LocalDateTime createdAt

) {}
