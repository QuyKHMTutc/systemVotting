package com.xxxx.systemvotting.modules.comment.service;

import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;

import java.util.List;

public interface CommentService {
    CommentResponseDTO createComment(CommentRequestDTO request, Long userId);
    List<CommentResponseDTO> getCommentsByPollId(Long pollId);
    List<CommentResponseDTO> getMyComments(Long userId);
}
