package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.common.service.imp.AiModerationService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.cache.CommentCacheInvalidator;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
    private UserRepository userRepository;

    @Mock
    private VoteRepository voteRepository;

    @Mock
    private RealTimeService realTimeService;

    @Mock
    private AiModerationService aiModerationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CommentCacheInvalidator commentCacheInvalidator;

    @InjectMocks
    private CommentServiceImpl commentService;

    @Test
    void createComment_shouldRejectParentCommentFromDifferentPoll() {
        User creator = User.builder().id(1L).username("creator").build();
        User actor = User.builder().id(2L).username("actor").build();
        Poll requestedPoll = Poll.builder().id(10L).creator(creator).build();
        Poll otherPoll = Poll.builder().id(99L).creator(creator).build();
        Comment parentInOtherPoll = Comment.builder().id(50L).poll(otherPoll).user(creator).content("root").build();
        CommentRequestDTO request = new CommentRequestDTO(10L, 50L, "reply", false);

        when(pollRepository.findById(10L)).thenReturn(Optional.of(requestedPoll));
        when(userRepository.findById(2L)).thenReturn(Optional.of(actor));
        when(commentRepository.findFirstByUserIdAndPollIdOrderByCreatedAtAsc(2L, 10L)).thenReturn(Optional.empty());
        when(aiModerationService.isToxicContent("reply")).thenReturn(false);
        when(commentRepository.findById(50L)).thenReturn(Optional.of(parentInOtherPoll));

        assertThrows(AppException.class, () -> commentService.createComment(request, 2L));

        verify(commentRepository, never()).save(any());
        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any(), any());
        verify(realTimeService, never()).broadcast(any(), any());
    }
}
