package com.xxxx.systemvotting.modules.vote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteEventDTO implements Serializable {
    private Long pollId;
    private Long optionId;
    private Long userId;
    private Long oldOptionId; // Null if it's a new vote
    private LocalDateTime timestamp;
}
