package com.xxxx.systemvotting.modules.moderation.service.impl;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModerationAdminServiceImplTest {

    @Mock private CommentRepository commentRepository;
    @Mock private PollRepository pollRepository;
    @Mock private VoteRepository voteRepository;
    @Mock private PollMapper pollMapper;
    @Mock private RealTimeService realTimeService;

    @InjectMocks
    private ModerationAdminServiceImpl moderationAdminService;

    @Test
    void reviewComment_approvesAndBroadcasts() {
        Poll poll = Poll.builder().id(10L).build();
        User user = User.builder().id(20L).username("guy").build();
        Comment comment = Comment.builder()
                .id(1L)
                .poll(poll)
                .user(user)
                .content("ok")
                .moderationStatus(ModerationStatus.REVIEW)
                .createdAt(LocalDateTime.now())
                .build();

        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));
        when(voteRepository.findByPollId(10L)).thenReturn(List.of());

        CommentResponseDTO dto = moderationAdminService.reviewComment(1L, ModerationStatus.APPROVED);
        assertEquals("APPROVED", dto.getModerationStatus());
        verify(realTimeService).broadcast(any(), any(CommentResponseDTO.class));
    }

    @Test
    void reviewPoll_rejectsWithoutBroadcast() {
        Poll poll = Poll.builder().id(2L).title("spam poll").moderationStatus(ModerationStatus.REVIEW).build();
        PollResponseDTO dto = new PollResponseDTO();
        dto.setId(2L);
        dto.setTitle("spam poll");

        when(pollRepository.findById(2L)).thenReturn(Optional.of(poll));
        when(pollRepository.save(any(Poll.class))).thenAnswer(i -> i.getArgument(0));
        when(pollMapper.toDto(any(Poll.class))).thenReturn(dto);

        PollResponseDTO result = moderationAdminService.reviewPoll(2L, ModerationStatus.REJECTED);
        assertEquals("REJECTED", result.getModerationStatus());
        verify(realTimeService, never()).broadcast(any(), any());
    }
}
