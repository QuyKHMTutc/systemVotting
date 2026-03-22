package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.poll.repository.TagRepository;
import com.xxxx.systemvotting.modules.poll.service.PollModerationService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PollServiceImplTest {

    @Mock private PollRepository pollRepository;
    @Mock private UserRepository userRepository;
    @Mock private VoteRepository voteRepository;
    @Mock private TagRepository tagRepository;
    @Mock private PollMapper pollMapper;
    @Mock private CommentRepository commentRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private RealTimeService realTimeService;
    @Mock private PollModerationService pollModerationService;

    @InjectMocks
    private PollServiceImpl pollService;

    @Test
    void createPoll_allowsNormalPoll() {
        Long creatorId = 7L;
        User creator = User.builder().id(creatorId).username("guy").build();

        OptionRequestDTO option1 = new OptionRequestDTO();
        option1.setText("  Java  ");
        OptionRequestDTO option2 = new OptionRequestDTO();
        option2.setText(" Spring Boot ");

        PollCreateRequestDTO request = new PollCreateRequestDTO();
        request.setCreatorId(creatorId);
        request.setTitle("  Ban thich ngon ngu nao nhat?  ");
        request.setDescription("  Chon dap an phu hop nhat  ");
        request.setOptions(new ArrayList<>(List.of(option1, option2)));
        request.setStartTime(LocalDateTime.now().plusMinutes(1));

        Poll mappedPoll = Poll.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .options(new LinkedHashSet<>())
                .tags(new java.util.HashSet<>())
                .build();

        Poll savedPoll = Poll.builder()
                .id(99L)
                .title("Ban thich ngon ngu nao nhat?")
                .description("Chon dap an phu hop nhat")
                .options(new LinkedHashSet<>())
                .tags(new java.util.HashSet<>())
                .creator(creator)
                .moderationStatus(ModerationStatus.APPROVED)
                .moderationLabel("normal")
                .build();
        savedPoll.addOption(Option.builder().id(1L).text("Java").voteCount(0).build());
        savedPoll.addOption(Option.builder().id(2L).text("Spring Boot").voteCount(0).build());

        PollResponseDTO responseDTO = new PollResponseDTO();
        responseDTO.setId(99L);
        responseDTO.setTitle(savedPoll.getTitle());
        responseDTO.setDescription(savedPoll.getDescription());
        responseDTO.setOptions(new ArrayList<>());

        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(pollModerationService.moderate(any(PollCreateRequestDTO.class))).thenReturn(PollModerationService.PollModerationResult.allowed());
        when(pollMapper.toEntity(any(PollCreateRequestDTO.class))).thenReturn(mappedPoll);
        when(pollMapper.toOptionEntity(any(OptionRequestDTO.class))).thenAnswer(invocation -> {
            OptionRequestDTO dto = invocation.getArgument(0);
            return Option.builder().text(dto.getText()).build();
        });
        when(pollRepository.save(any(Poll.class))).thenReturn(savedPoll);
        when(pollMapper.toDto(savedPoll)).thenReturn(responseDTO);

        PollResponseDTO created = pollService.createPoll(request);

        assertEquals(99L, created.getId());
        assertEquals("APPROVED", created.getModerationStatus());
        ArgumentCaptor<PollCreateRequestDTO> requestCaptor = ArgumentCaptor.forClass(PollCreateRequestDTO.class);
        verify(pollMapper).toEntity(requestCaptor.capture());
        assertEquals("Ban thich ngon ngu nao nhat?", requestCaptor.getValue().getTitle());
        assertEquals("Chon dap an phu hop nhat", requestCaptor.getValue().getDescription());
        assertEquals("Java", requestCaptor.getValue().getOptions().get(0).getText());
        verify(realTimeService).broadcast(eq("/topic/polls/events"), any());
    }

    @Test
    void createPoll_marksSpamPollForReviewWithoutBroadcast() {
        Long creatorId = 7L;
        User creator = User.builder().id(creatorId).username("guy").build();

        OptionRequestDTO option1 = new OptionRequestDTO();
        option1.setText("option 1");
        OptionRequestDTO option2 = new OptionRequestDTO();
        option2.setText("option 2");

        PollCreateRequestDTO request = new PollCreateRequestDTO();
        request.setCreatorId(creatorId);
        request.setTitle("Click vao link de nhan qua mien phi ngay");
        request.setOptions(List.of(option1, option2));
        request.setStartTime(LocalDateTime.now().plusMinutes(1));

        Poll mappedPoll = Poll.builder().title(request.getTitle()).options(new LinkedHashSet<>()).tags(new java.util.HashSet<>()).build();
        Poll savedPoll = Poll.builder()
                .id(101L)
                .title(request.getTitle())
                .options(new LinkedHashSet<>())
                .tags(new java.util.HashSet<>())
                .creator(creator)
                .moderationStatus(ModerationStatus.REVIEW)
                .moderationLabel("spam")
                .moderationField("title")
                .moderationConfidence(0.97)
                .build();
        savedPoll.addOption(Option.builder().id(1L).text("option 1").voteCount(0).build());
        savedPoll.addOption(Option.builder().id(2L).text("option 2").voteCount(0).build());

        PollResponseDTO responseDTO = new PollResponseDTO();
        responseDTO.setId(101L);
        responseDTO.setTitle(savedPoll.getTitle());
        responseDTO.setOptions(new ArrayList<>());

        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(pollModerationService.moderate(any(PollCreateRequestDTO.class)))
                .thenReturn(new PollModerationService.PollModerationResult(true, "spam", "title", 0.97, "blocked", true));
        when(pollMapper.toEntity(any(PollCreateRequestDTO.class))).thenReturn(mappedPoll);
        when(pollMapper.toOptionEntity(any(OptionRequestDTO.class))).thenAnswer(invocation -> {
            OptionRequestDTO dto = invocation.getArgument(0);
            return Option.builder().text(dto.getText()).build();
        });
        when(pollRepository.save(any(Poll.class))).thenReturn(savedPoll);
        when(pollMapper.toDto(savedPoll)).thenReturn(responseDTO);

        PollResponseDTO created = pollService.createPoll(request);

        assertEquals("REVIEW", created.getModerationStatus());
        assertEquals("spam", created.getModerationLabel());
        verify(pollRepository).save(any(Poll.class));
        verify(realTimeService, never()).broadcast(any(), any());
    }
}
