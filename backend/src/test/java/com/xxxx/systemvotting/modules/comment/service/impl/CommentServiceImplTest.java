package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentModerationService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PollRepository pollRepository;
    @Mock
    private VoteRepository voteRepository;
    @Mock
    private RealTimeService realTimeService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentModerationService commentModerationService;

    @InjectMocks
    private CommentServiceImpl commentService;

    @Test
    void createComment_allowsNormalCommentAndBroadcasts() {
        Long userId = 10L;
        Long pollId = 20L;

        Poll poll = Poll.builder().id(pollId).title("Test poll").build();
        User user = User.builder().id(userId).username("guy").avatarUrl("avatar.png").build();

        CommentRequestDTO request = CommentRequestDTO.builder()
                .pollId(pollId)
                .content("Toi chon phuong an 2 vi tiet kiem chi phi hon")
                .isAnonymous(false)
                .build();

        when(pollRepository.findById(pollId)).thenReturn(Optional.of(poll));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentModerationService.moderate(request.getContent().trim()))
                .thenReturn(new CommentModerationService.ModerationResult("normal", false, "ok", 0.91, true));
        when(voteRepository.findByUserIdAndPollId(userId, pollId)).thenReturn(Optional.empty());
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            c.setId(99L);
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });

        CommentResponseDTO response = commentService.createComment(request, userId);

        assertEquals(99L, response.getId());
        assertEquals("guy", response.getUsername());
        assertEquals("Toi chon phuong an 2 vi tiet kiem chi phi hon", response.getContent());
        assertFalse(response.isAnonymous());

        ArgumentCaptor<Comment> savedCaptor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(savedCaptor.capture());
        assertEquals("Toi chon phuong an 2 vi tiet kiem chi phi hon", savedCaptor.getValue().getContent());

        verify(realTimeService).broadcast(eq("/topic/polls/20/comments"), any(CommentResponseDTO.class));
    }

    @Test
    void createComment_blocksSpamComment() {
        Long userId = 10L;
        Long pollId = 20L;

        Poll poll = Poll.builder().id(pollId).title("Test poll").build();
        User user = User.builder().id(userId).username("guy").build();

        CommentRequestDTO request = CommentRequestDTO.builder()
                .pollId(pollId)
                .content("Click vao link de nhan qua mien phi ngay")
                .isAnonymous(false)
                .build();

        when(pollRepository.findById(pollId)).thenReturn(Optional.of(poll));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentModerationService.moderate(request.getContent().trim()))
                .thenReturn(new CommentModerationService.ModerationResult("spam", true, "blocked", 0.96, true));

        AppException ex = assertThrows(AppException.class, () -> commentService.createComment(request, userId));
        assertEquals(ErrorCode.COMMENT_BLOCKED, ex.getErrorCode());

        verify(commentRepository, never()).save(any(Comment.class));
        verify(realTimeService, never()).broadcast(any(), any());
    }

    @Test
    void createComment_allowsWhenModerationUnavailable() {
        Long userId = 10L;
        Long pollId = 20L;

        Poll poll = Poll.builder().id(pollId).title("Test poll").build();
        User user = User.builder().id(userId).username("guy").build();

        CommentRequestDTO request = CommentRequestDTO.builder()
                .pollId(pollId)
                .content("Comment binh thuong")
                .isAnonymous(true)
                .build();

        when(pollRepository.findById(pollId)).thenReturn(Optional.of(poll));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentModerationService.moderate(request.getContent().trim()))
                .thenReturn(CommentModerationService.ModerationResult.unavailable());
        when(voteRepository.findByUserIdAndPollId(userId, pollId)).thenReturn(Optional.empty());
        when(commentRepository.findByPollIdOrderByCreatedAtDesc(pollId)).thenReturn(List.of());
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            c.setId(100L);
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });

        CommentResponseDTO response = commentService.createComment(request, userId);

        assertEquals(100L, response.getId());
        assertTrue(response.isAnonymous());
        verify(commentRepository).save(any(Comment.class));
    }
}
