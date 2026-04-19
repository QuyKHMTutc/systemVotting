package com.xxxx.systemvotting.modules.comment.service;

import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentThreadResponse;

import java.util.List;

public interface CommentService {
    CommentResponseDTO createComment(CommentRequestDTO request, Long userId);

    CommentThreadResponse getCommentsByPollId(Long pollId, int page, int size);

    List<CommentResponseDTO> getMyComments(Long userId);

    com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO getIdentityStatus(Long pollId, Long userId);
}
