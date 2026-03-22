package com.xxxx.systemvotting.modules.moderation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ModerationQueueResponseDTO {
    private List<com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO> comments;
    private List<com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO> polls;
}
