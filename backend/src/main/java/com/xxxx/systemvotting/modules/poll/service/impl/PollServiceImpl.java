package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.exception.custom.BadRequestException;
import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.entity.Tag;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.poll.repository.TagRepository;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PollServiceImpl implements PollService {

    private final PollRepository pollRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final TagRepository tagRepository;
    private final PollMapper pollMapper;
    private final CommentRepository commentRepository;

    private int getCommentCountForPoll(Long pollId) {
        return commentRepository.findByPollIdOrderByCreatedAtDesc(pollId).size();
    }

    @Override
    @Transactional
    public PollResponseDTO createPoll(PollCreateRequestDTO requestDTO) {
        // Validate creator
        User creator = userRepository.findById(requestDTO.getCreatorId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("User not found with id: " + requestDTO.getCreatorId()));

        Poll poll = pollMapper.toEntity(requestDTO);
        poll.setCreator(creator);
        java.time.LocalDateTime startTime = poll.getStartTime();
        java.time.LocalDateTime endTime = poll.getEndTime();
        if (startTime == null) {
            startTime = java.time.LocalDateTime.now();
            poll.setStartTime(startTime);
        }
        if (endTime != null && !endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        // Handle tags dynamic creation/mapping
        if (requestDTO.getTags() != null) {
            for (String tagName : requestDTO.getTags()) {
                String trimmedName = tagName.trim();
                if (!trimmedName.isEmpty()) {
                    Tag tag = tagRepository.findByName(trimmedName)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(trimmedName).build()));
                    poll.getTags().add(tag);
                }
            }
        }

        // Map and add options while preserving bidirectional relationship
        for (OptionRequestDTO optionRequest : requestDTO.getOptions()) {
            Option option = pollMapper.toOptionEntity(optionRequest);
            option.setVoteCount(0);
            poll.addOption(option);
        }

        Poll savedPoll = pollRepository.save(poll);
        PollResponseDTO dto = pollMapper.toDto(savedPoll);
        dto.setCommentCount(0); // Brand new poll has 0 comments
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PollResponseDTO getPollById(Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + id));
        PollResponseDTO dto = pollMapper.toDto(poll);
        dto.setCommentCount(getCommentCountForPoll(id));
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PollResponseDTO> getAllPolls(String title, String tag, String status, Pageable pageable) {
        Page<Poll> pollPage = pollRepository.findWithFilters(title, tag, status, java.time.LocalDateTime.now(), pageable);
        return pollPage.map(poll -> {
            PollResponseDTO dto = pollMapper.toDto(poll);
            dto.setCommentCount(getCommentCountForPoll(poll.getId()));
            return dto;
        });
    }

    @Override
    @Transactional
    public void deletePoll(Long pollId, User authenticatedUser) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + pollId));

        boolean isAdmin = authenticatedUser.getRole().name().equals("ADMIN");
        boolean isCreator = poll.getCreator().getId().equals(authenticatedUser.getId());

        if (!isAdmin && !isCreator) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to delete this poll");
        }

        // Delete votes and comments before poll (FK constraints)
        poll.getOptions().forEach(option -> voteRepository.deleteByOptionId(option.getId()));
        commentRepository.deleteByPoll_Id(poll.getId());

        pollRepository.delete(poll);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PollResponseDTO> getMyPolls(Long userId) {
        java.util.List<Poll> polls = pollRepository.findByCreatorIdOrderByIdDesc(userId);
        return polls.stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(getCommentCountForPoll(poll.getId()));
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PollResponseDTO> getVotedPolls(Long userId) {
        java.util.List<Poll> polls = pollRepository.findPollsVotedByUser(userId);
        return polls.stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(getCommentCountForPoll(poll.getId()));
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
