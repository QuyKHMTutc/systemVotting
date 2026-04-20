package com.xxxx.systemvotting.modules.comment.service;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentThreadResponse;

public interface CommentService {
    CommentResponseDTO createComment(CommentRequestDTO request, Long userId);

    CommentThreadResponse getCommentsByPollId(Long pollId, int page, int size);

    PageResponse<CommentResponseDTO> getMyComments(Long userId, int page, int size);

    com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO getIdentityStatus(Long pollId, Long userId);
}
