package com.xxxx.systemvotting.modules.vote.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VoteResponseDTO {
    private Long id;
    private Long userId;
    private Long pollId;
    private Long optionId;
    private LocalDateTime createdAt;
}
