package com.xxxx.systemvotting.modules.poll.service.impl;

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

    @Override
    @Transactional
    public PollResponseDTO createPoll(PollCreateRequestDTO requestDTO) {
        // Validate creator
        User creator = userRepository.findById(requestDTO.getCreatorId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("User not found with id: " + requestDTO.getCreatorId()));

        Poll poll = pollMapper.toEntity(requestDTO);
        poll.setCreator(creator);
        if (poll.getStartTime() == null) {
            poll.setStartTime(java.time.LocalDateTime.now());
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
        return pollMapper.toDto(savedPoll);
    }

    @Override
    @Transactional(readOnly = true)
    public PollResponseDTO getPollById(Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + id));
        return pollMapper.toDto(poll);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PollResponseDTO> getAllPolls(String title, String tag, String status, Pageable pageable) {
        Page<Poll> pollPage = pollRepository.findWithFilters(title, tag, status, java.time.LocalDateTime.now(), pageable);
        return pollPage.map(pollMapper::toDto);
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

        // Delete all votes associated with this poll's options to satisfy FK
        // constraints
        poll.getOptions().forEach(option -> voteRepository.deleteByOptionId(option.getId()));

        pollRepository.delete(poll);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PollResponseDTO> getMyPolls(Long userId) {
        java.util.List<Poll> polls = pollRepository.findByCreatorIdOrderByIdDesc(userId);
        return polls.stream()
                .map(pollMapper::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PollResponseDTO> getVotedPolls(Long userId) {
        java.util.List<Poll> polls = pollRepository.findPollsVotedByUser(userId);
        return polls.stream()
                .map(pollMapper::toDto)
                .collect(java.util.stream.Collectors.toList());
    }
}
