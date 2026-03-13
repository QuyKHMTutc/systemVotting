package com.xxxx.systemvotting.modules.comment.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {
    private Long id;
    private Long userId;
    private String username;
    private String avatarUrl;
    private String content;
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;
    private LocalDateTime createdAt;
    
    // The dynamically assigned vote status (e.g., "Chưa vote", or the exact option text they voted for)
    private String voteStatus;

    private Long parentId;
    private java.util.List<CommentResponseDTO> replies;
}
