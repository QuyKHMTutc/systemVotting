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
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.security.CustomUserDetails;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;
    private final com.xxxx.systemvotting.common.service.RealTimeService realTimeService;

    private int getCommentCountForPoll(Long pollId) {
        return (int) commentRepository.countByPollId(pollId);
    }

    private void enrichPollWithRedisData(PollResponseDTO dto) {
        if (dto.getOptions() == null) return;
        String redisCountKey = com.xxxx.systemvotting.common.utils.RedisKeyUtils.getPollVotesKey(dto.getId());
        java.util.Map<Object, Object> redisMap = redisTemplate.opsForHash().entries(redisCountKey);
        if (redisMap != null && !redisMap.isEmpty()) {
            for (com.xxxx.systemvotting.modules.poll.dto.OptionResponseDTO option : dto.getOptions()) {
                Object val = redisMap.get(option.getId().toString());
                if (val != null) {
                    try {
                        option.setVoteCount(Integer.parseInt(val.toString()));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
    }

    @Override
    @Transactional
    public PollResponseDTO createPoll(PollCreateRequestDTO requestDTO) {
        // Validate creator
        com.xxxx.systemvotting.modules.user.entity.User creator = userRepository.findById(requestDTO.getCreatorId())
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
        
        // Broadcast new poll to dashboard
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("type", "CREATED");
        payload.put("poll", dto);
        realTimeService.broadcast("/topic/polls/events", payload);
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "pollDetails", key = "#id")
    public PollResponseDTO getPollById(Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + id));
        PollResponseDTO dto = pollMapper.toDto(poll);
        dto.setCommentCount(getCommentCountForPoll(id));
        enrichPollWithRedisData(dto);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PollResponseDTO> getAllPolls(String title, String tag, String status, int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Poll> pollPage = pollRepository.findWithFilters(title, tag, status, java.time.LocalDateTime.now(), pageable);
        return pollPage.map(poll -> {
            PollResponseDTO dto = pollMapper.toDto(poll);
            dto.setCommentCount(getCommentCountForPoll(poll.getId()));
            enrichPollWithRedisData(dto);
            return dto;
        });
    }

    @Override
    @Transactional
    @CacheEvict(value = "pollDetails", key = "#pollId")
    public void deletePoll(Long pollId, CustomUserDetails authenticatedUser) {
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
        
        // Broadcast deletion event to dashboard
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("type", "DELETED");
        payload.put("pollId", pollId);
        realTimeService.broadcast("/topic/polls/events", payload);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PollResponseDTO> getMyPolls(Long userId) {
        java.util.List<Poll> polls = pollRepository.findByCreatorIdOrderByIdDesc(userId);
        return polls.stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(getCommentCountForPoll(poll.getId()));
                    enrichPollWithRedisData(dto);
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
                    enrichPollWithRedisData(dto);
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
