package com.xxxx.systemvotting.modules.vote.service.impl;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.OptionRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.vote.service.RateLimitService;
import com.xxxx.systemvotting.modules.vote.service.RankingService;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.mapper.VoteMapper;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.RedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.Arrays;

import com.xxxx.systemvotting.modules.vote.dto.VoteEventDTO;
import com.xxxx.systemvotting.common.utils.RedisKeyUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoteServiceImpl implements VoteService {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final PollRepository pollRepository;
    private final OptionRepository optionRepository;
    private final VoteMapper voteMapper;
    private final RealTimeService realTimeService;
    
    private final RateLimitService rateLimitService;
    private final RankingService rankingService;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    private static final String VOTE_LUA =
            "local userVotesKey = KEYS[1] " +
            "local pollVotesKey = KEYS[2] " +
            "local queueKey = KEYS[3] " +
            "local userId = ARGV[1] " +
            "local newOptionId = ARGV[2] " +
            "local eventJson = ARGV[3] " +
            "local oldOptionId = redis.call('HGET', userVotesKey, userId) " +
            "if oldOptionId == newOptionId then " +
            "    return '-1' " +
            "end " +
            "redis.call('HSET', userVotesKey, userId, newOptionId) " +
            "if oldOptionId then " +
            "    redis.call('HINCRBY', pollVotesKey, oldOptionId, -1) " +
            "end " +
            "redis.call('HINCRBY', pollVotesKey, newOptionId, 1) " +
            "local finalJson = string.gsub(eventJson, '-999', oldOptionId or 'null') " +
            "redis.call('LPUSH', queueKey, finalJson) " +
            "return oldOptionId or ''";

    private final RedisScript<String> voteScript = new DefaultRedisScript<>(VOTE_LUA, String.class);

    @Override
    @Transactional
    @CacheEvict(value = "pollDetails", key = "#requestDTO.pollId")
    public VoteResponseDTO submitVote(VoteRequestDTO requestDTO) {
        Long userId = requestDTO.getUserId();
        Long pollId = requestDTO.getPollId();
        Long newOptionId = requestDTO.getOptionId();

        // 1. Rate Limiting Check
        rateLimitService.checkAndRecordVoteAttempt(userId);

        // 2. Validate Time Constraints directly from DB
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        if (poll.getStartTime() != null && now.isBefore(poll.getStartTime())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (poll.getEndTime() != null && now.isAfter(poll.getEndTime())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Option newOption = optionRepository.findById(newOptionId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!newOption.getPoll().getId().equals(poll.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 3. Atomically track user's choice and push event via Lua Script
        String userVotesKey = RedisKeyUtils.getPollUserVotesKey(pollId);
        String pollVotesKey = RedisKeyUtils.getPollVotesKey(pollId);
        String queueKey = RedisKeyUtils.getVoteEventQueueKey();
        
        // Construct event template (using -999 as placeholder for oldOptionId)
        VoteEventDTO tempEvent = VoteEventDTO.builder()
                .userId(userId)
                .pollId(pollId)
                .optionId(newOptionId)
                .oldOptionId(-999L)
                .timestamp(now)
                .build();
                
        String eventJsonTemplate;
        try {
            eventJsonTemplate = objectMapper.writeValueAsString(tempEvent);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize vote event", e);
        }

        String result = redisTemplate.execute(
                voteScript,
                Arrays.asList(userVotesKey, pollVotesKey, queueKey),
                String.valueOf(userId), String.valueOf(newOptionId), eventJsonTemplate
        );

        if ("-1".equals(result)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }
        
        Long oldOptionId = null;
        if (result != null && !result.isEmpty()) {
            oldOptionId = Long.parseLong(result);
        } else {
            // First time voting on this poll
            rankingService.incrementPollScore(pollId, 1);
            
            // Notify poll creator
            if (!poll.getCreator().getId().equals(userId)) {
                User voter = userRepository.findById(userId).orElse(null);
                if (voter != null) {
                    notificationService.createNotification(
                            poll.getCreator().getId(),
                            voter.getUsername(),
                            voter.getAvatarUrl(),
                            "NEW_VOTE",
                            "đã vote vào cuộc thăm dò của bạn",
                            poll.getId(),
                            null
                    );
                }
            }
        }

        // 6. Broadcast updated vote counts to WebSocket subscribers seamlessly
        broadcastVoteUpdates(poll, pollVotesKey);

        // Immediately return mock saved format. No block for DB save.
        Vote mockSave = new Vote();
        mockSave.setId(-1L); // Async indicator
        mockSave.setOption(newOption);
        mockSave.setPoll(poll);
        User mockUser = new User();
        mockUser.setId(userId);
        mockSave.setUser(mockUser);
        mockSave.setCreatedAt(now);
        return voteMapper.toDto(mockSave);
    }

    private void broadcastVoteUpdates(Poll poll, String pollVotesKey) {
        // Fetch all option counts from redis to broadcast latest state
        Map<Object, Object> allCounts = redisTemplate.opsForHash().entries(pollVotesKey);

        List<Map<String, Object>> optionUpdates = poll.getOptions().stream().map(o -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("optionId", o.getId());
            m.put("text", o.getText());
            
            Object redisCountObj = allCounts.get(String.valueOf(o.getId()));
            int currentRedisCount = redisCountObj != null ? Integer.parseInt(redisCountObj.toString()) : o.getVoteCount();
            
            m.put("voteCount", currentRedisCount);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("pollId", poll.getId());
        payload.put("options", optionUpdates);
        
        // 1. Broadcast to specific poll detail page clients
        realTimeService.broadcast("/topic/polls/" + poll.getId() + "/votes", payload);
        
        // 2. Broadcast to global dashboard clients
        Map<String, Object> globalPayload = new LinkedHashMap<>();
        globalPayload.put("type", "VOTED");
        globalPayload.put("pollId", poll.getId());
        globalPayload.put("options", optionUpdates);
        realTimeService.broadcast("/topic/polls/events", globalPayload);
    }

    @Override
    @Transactional(readOnly = true)
    public com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO checkVote(Long userId, Long pollId) {
        String userVotesKey = RedisKeyUtils.getPollUserVotesKey(pollId);
        Object optionIdObj = redisTemplate.opsForHash().get(userVotesKey, String.valueOf(userId));

        if (optionIdObj != null) {
            return new com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO(
                    true,
                    Long.parseLong(optionIdObj.toString())
            );
        }

        // Fallback to database if redis key was cleared or not populated yet
        return voteRepository.findByUserIdAndPollId(userId, pollId)
                .map(vote -> {
                    // Backfill Redis so next time it's fast
                    redisTemplate.opsForHash().put(userVotesKey, String.valueOf(userId), String.valueOf(vote.getOption().getId()));
                    return new com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO(
                            true,
                            vote.getOption().getId()
                    );
                })
                .orElse(new com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO(
                        false,
                        null
                ));
    }
}
