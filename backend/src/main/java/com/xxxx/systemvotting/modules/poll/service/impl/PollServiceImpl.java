package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.common.utils.PlanPollLimits;
import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.OptionResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.entity.Tag;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.poll.repository.TagRepository;
import com.xxxx.systemvotting.modules.poll.service.PollDetailsCacheLoader;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.common.service.imp.AiModerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PollServiceImpl implements PollService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "endTime", "title", "id");

    private final PollRepository pollRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final TagRepository tagRepository;
    private final PollMapper pollMapper;
    private final CommentRepository commentRepository;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;
    // StringRedisTemplate for pipeline operations — uses StringRedisSerializer so raw connection
    // byte[] results are correctly returned without JSON deserialization interference
    private final org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;
    private final com.xxxx.systemvotting.common.service.RealTimeService realTimeService;
    private final AiModerationService aiModerationService;
    private final PollDetailsCacheLoader pollDetailsCacheLoader;

    private Map<Long, Integer> getCommentCountsForPolls(List<Long> pollIds) {
        Map<Long, Integer> commentCountMap = new HashMap<>();
        if (pollIds == null || pollIds.isEmpty()) return commentCountMap;

        List<Object[]> results = commentRepository.countCommentsByPollIds(pollIds);
        for (Object[] result : results) {
            commentCountMap.put(((Number) result[0]).longValue(), ((Number) result[1]).intValue());
        }
        return commentCountMap;
    }

    /**
     * Removes live vote hashes for a poll. Required when DB ids are reused (e.g. dev reset,
     * {@code ddl-auto}, manual truncate) while Redis keeps old counters — otherwise a brand-new
     * poll inherits stale totals. Also call on delete so Redis cannot resurrect ghost counts.
     */
    private void clearPollVoteStateInRedis(Long pollId) {
        stringRedisTemplate.delete(List.of(
                RedisKeyUtils.getPollVotesKey(pollId),
                RedisKeyUtils.getPollUserVotesKey(pollId)));
    }

    /**
     * Enriches a SINGLE poll DTO with live vote counts from Redis.
     * Used only for getPollById (single item — no pipeline needed).
     */
    private void enrichPollWithRedisData(PollResponseDTO dto) {
        if (dto.getOptions() == null || dto.getOptions().isEmpty()) return;
        String redisCountKey = RedisKeyUtils.getPollVotesKey(dto.getId());
        Map<Object, Object> redisMap = redisTemplate.opsForHash().entries(redisCountKey);
        if (redisMap.isEmpty()) return;

        // Records are immutable — rebuild each option with the updated vote count
        List<OptionResponseDTO> enriched = dto.getOptions().stream()
                .map(option -> {
                    Object val = redisMap.get(option.id().toString());
                    if (val == null) return option;
                    try {
                        return new OptionResponseDTO(option.id(), option.text(), Integer.parseInt(val.toString()));
                    } catch (NumberFormatException ignored) {
                        return option;
                    }
                })
                .collect(Collectors.toList());

        // PollResponseDTO is also a record — cannot set fields, so we need to work around:
        // the mapper will rebuild with enriched options (handled at call site in getPollById)
        dto.getOptions().clear();
        dto.getOptions().addAll(enriched);
    }

    /**
     * Enriches a LIST of poll DTOs with live Redis vote counts using a SINGLE pipeline call.
     *
     * Performance: Replaces N individual HGETALL calls (one per poll) with 1 pipelined
     * request — reduces Redis latency from O(N * RTT) to O(1 * RTT).
     *
     * @param dtos list of poll response DTOs to enrich
     */
    private void enrichPollListWithRedisData(List<PollResponseDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;

        // Use StringRedisTemplate for pipeline — its StringRedisSerializer means:
        // - Keys sent as raw UTF-8 bytes (matching how VoteEventConsumer stores them)
        // - executePipelined returns Map<byte[], byte[]> from raw connection commands
        List<Object> pipelineResults = stringRedisTemplate.executePipelined(
            (RedisCallback<Object>) connection -> {
                for (PollResponseDTO dto : dtos) {
                    String key = com.xxxx.systemvotting.common.utils.RedisKeyUtils.getPollVotesKey(dto.getId());
                    connection.hashCommands().hGetAll(key.getBytes(StandardCharsets.UTF_8));
                }
                return null;
            }
        );

        for (int i = 0; i < dtos.size(); i++) {
            PollResponseDTO dto = dtos.get(i);
            if (dto.getOptions() == null) continue;

            Object raw = pipelineResults.get(i);
            if (raw == null) continue;

            // StringRedisTemplate pipeline returns Map<byte[], byte[]> from raw hGetAll
            Map<String, String> redisMap = new HashMap<>();
            if (raw instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<Object, Object> rawMap = (Map<Object, Object>) raw;
                for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
                    if (entry.getKey() == null || entry.getValue() == null) continue;
                    String k = entry.getKey() instanceof byte[]
                            ? new String((byte[]) entry.getKey(), StandardCharsets.UTF_8)
                            : entry.getKey().toString();
                    String v = entry.getValue() instanceof byte[]
                            ? new String((byte[]) entry.getValue(), StandardCharsets.UTF_8)
                            : entry.getValue().toString();
                    redisMap.put(k, v);
                }
            }
            if (redisMap.isEmpty()) continue;

            // Records are immutable — rebuild each option with updated count
            List<OptionResponseDTO> enriched = dto.getOptions().stream()
                    .map(option -> {
                        String val = redisMap.get(option.id().toString());
                        if (val == null) return option;
                        try {
                            return new OptionResponseDTO(option.id(), option.text(), Integer.parseInt(val));
                        } catch (NumberFormatException ignored) {
                            return option;
                        }
                    })
                    .collect(Collectors.toList());
            dto.getOptions().clear();
            dto.getOptions().addAll(enriched);
        }
    }

    @Override
    @Transactional
    public PollResponseDTO createPoll(PollCreateRequestDTO requestDTO) {
        // AI Toxicity Check for Poll Title
        if (aiModerationService.isToxicContent(requestDTO.title())) {
            throw new AppException(ErrorCode.TOXIC_CONTENT);
        }

        // Validate creator
        User creator = userRepository.findById(requestDTO.creatorId())
                .orElseThrow(
                        () -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (creator.getRole() != Role.ADMIN) {
            Integer maxRooms = PlanPollLimits.maxRooms(creator.getPlan());
            if (maxRooms != null) {
                long existing = pollRepository.countActiveByCreator(creator.getId(), LocalDateTime.now());
                if (existing >= maxRooms) {
                    throw new AppException(ErrorCode.POLL_ROOM_LIMIT_EXCEEDED);
                }
            }
        }

        Poll poll = pollMapper.toEntity(requestDTO);
        poll.setCreator(creator);
        LocalDateTime startTime = poll.getStartTime();
        LocalDateTime endTime = poll.getEndTime();
        if (startTime == null) {
            startTime = LocalDateTime.now();
            poll.setStartTime(startTime);
        }
        if (endTime != null && !endTime.isAfter(startTime)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Handle tags dynamic creation/mapping
        if (requestDTO.tags() != null) {
            for (String tagName : requestDTO.tags()) {
                String trimmedName = tagName.trim();
                if (!trimmedName.isEmpty()) {
                    Tag tag = tagRepository.findByName(trimmedName)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(trimmedName).build()));
                    poll.getTags().add(tag);
                }
            }
        }

        // Map and add options while preserving bidirectional relationship
        for (OptionRequestDTO optionRequest : requestDTO.options()) {
            // AI Toxicity Check for each Option
            if (aiModerationService.isToxicContent(optionRequest.text())) {
                throw new AppException(ErrorCode.TOXIC_CONTENT);
            }

            Option option = pollMapper.toOptionEntity(optionRequest);
            option.setVoteCount(0);
            poll.addOption(option);
        }

        Poll savedPoll = pollRepository.save(poll);
        clearPollVoteStateInRedis(savedPoll.getId());

        PollResponseDTO dto = pollMapper.toDto(savedPoll);
        dto.setCommentCount(0); // Brand new poll has 0 comments
        
        // Broadcast new poll to dashboard
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "CREATED");
        payload.put("poll", dto);
        realTimeService.broadcast("/topic/polls/events", payload);
        
        return dto;
    }

    @Override
    public PollResponseDTO getPollById(Long id) {
        PollResponseDTO dto = pollDetailsCacheLoader.loadDbSnapshot(id);
        enrichPollWithRedisData(dto);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PollResponseDTO> getAllPolls(String title, String tag, String status, int page, int size, String sortBy, String direction) {
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();
        sort = sort.and(Sort.by("id").descending());
        
        int pageNumber = Math.max(0, page);
        Pageable pageable = PageRequest.of(pageNumber, size, sort);
        Page<Poll> pollPage = pollRepository.findWithFilters(title, tag, status, LocalDateTime.now(), pageable);
        
        List<Long> pollIds = pollPage.getContent().stream().map(Poll::getId).collect(Collectors.toList());
        Map<Long, Integer> commentCountsMap = getCommentCountsForPolls(pollIds);

        // Map polls to DTOs first, then batch-enrich with Redis in a single pipeline call
        List<PollResponseDTO> pollDtos = pollPage.getContent().stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(commentCountsMap.getOrDefault(poll.getId(), 0));
                    return dto;
                })
                .collect(Collectors.toList());

        // Single pipeline call for all vote counts (replaces N individual HGETALL calls)
        enrichPollListWithRedisData(pollDtos);

        org.springframework.data.domain.Page<PollResponseDTO> resultPage =
                new PageImpl<>(pollDtos, pageable, pollPage.getTotalElements());

        return PageResponse.from(resultPage);
    }

    @Override
    @Transactional
    @CacheEvict(value = "pollDetails", key = "#pollId")
    public void deletePoll(Long pollId, User authenticatedUser) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

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
        clearPollVoteStateInRedis(pollId);

        // Broadcast deletion event to dashboard
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "DELETED");
        payload.put("pollId", pollId);
        realTimeService.broadcast("/topic/polls/events", payload);
    }

    private static final int MAX_PROFILE_POLL_PAGE_SIZE = 100;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PollResponseDTO> getMyPolls(Long userId, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = Math.min(Math.max(1, size), MAX_PROFILE_POLL_PAGE_SIZE);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("id").descending());
        Page<Poll> pollPage = pollRepository.findByCreatorId(userId, pageable);

        List<Long> pollIds = pollPage.getContent().stream().map(Poll::getId).collect(Collectors.toList());
        Map<Long, Integer> commentCountsMap = getCommentCountsForPolls(pollIds);

        List<PollResponseDTO> myPollDtos = pollPage.getContent().stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(commentCountsMap.getOrDefault(poll.getId(), 0));
                    return dto;
                })
                .collect(Collectors.toList());
        enrichPollListWithRedisData(myPollDtos);
        Page<PollResponseDTO> resultPage = new PageImpl<>(myPollDtos, pageable, pollPage.getTotalElements());
        return PageResponse.from(resultPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PollResponseDTO> getVotedPolls(Long userId, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = Math.min(Math.max(1, size), MAX_PROFILE_POLL_PAGE_SIZE);
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Poll> pollPage = pollRepository.findPollsVotedByUser(userId, pageable);

        List<Long> pollIds = pollPage.getContent().stream().map(Poll::getId).collect(Collectors.toList());
        Map<Long, Integer> commentCountsMap = getCommentCountsForPolls(pollIds);

        List<PollResponseDTO> votedPollDtos = pollPage.getContent().stream()
                .map(poll -> {
                    PollResponseDTO dto = pollMapper.toDto(poll);
                    dto.setCommentCount(commentCountsMap.getOrDefault(poll.getId(), 0));
                    return dto;
                })
                .collect(Collectors.toList());
        enrichPollListWithRedisData(votedPollDtos);
        Page<PollResponseDTO> resultPage = new PageImpl<>(votedPollDtos, pageable, pollPage.getTotalElements());
        return PageResponse.from(resultPage);
    }
}
