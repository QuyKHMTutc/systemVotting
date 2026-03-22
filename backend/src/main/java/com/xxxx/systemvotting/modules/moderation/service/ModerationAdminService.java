package com.xxxx.systemvotting.modules.moderation.service;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.moderation.dto.ModerationQueueResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;

public interface ModerationAdminService {
    ModerationQueueResponseDTO getReviewQueue();
    CommentResponseDTO reviewComment(Long commentId, ModerationStatus decision);
    PollResponseDTO reviewPoll(Long pollId, ModerationStatus decision);
}
