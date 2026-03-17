package com.xxxx.systemvotting.modules.vote.service.impl;

import com.xxxx.systemvotting.exception.custom.BadRequestException;
import com.xxxx.systemvotting.exception.custom.DuplicateResourceException;
import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.OptionRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.vote.service.RateLimitService;
import com.xxxx.systemvotting.modules.vote.service.RankingService;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + pollId));

        LocalDateTime now = LocalDateTime.now();
        if (poll.getStartTime() != null && now.isBefore(poll.getStartTime())) {
            throw new BadRequestException("The poll has not started yet");
        }
        if (poll.getEndTime() != null && now.isAfter(poll.getEndTime())) {
            throw new BadRequestException("The poll has already ended");
        }

        Option newOption = optionRepository.findById(newOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + newOptionId));

        if (!newOption.getPoll().getId().equals(poll.getId())) {
            throw new BadRequestException("Option does not belong to the specified Poll");
        }

        // 3. Atomically track user's choice in Redis Hash
        String userVotesKey = RedisKeyUtils.getPollUserVotesKey(pollId);
        String pollVotesKey = RedisKeyUtils.getPollVotesKey(pollId);
        
        // Find if user already voted. HGET is O(1)
        Object previousVoteObj = redisTemplate.opsForHash().get(userVotesKey, String.valueOf(userId));
        Long oldOptionId = previousVoteObj != null ? Long.parseLong(previousVoteObj.toString()) : null;

        if (newOptionId.equals(oldOptionId)) {
            throw new DuplicateResourceException("User has already voted for this option");
        }

        // Set new vote in Hash
        redisTemplate.opsForHash().put(userVotesKey, String.valueOf(userId), String.valueOf(newOptionId));

        // 4. Update atomic option counts in Redis
        // Decrement old option count if changing vote
        if (oldOptionId != null) {
            redisTemplate.opsForHash().increment(pollVotesKey, String.valueOf(oldOptionId), -1);
        } else {
            // First time voting on this poll, increment total poll score for ranking
            rankingService.incrementPollScore(pollId, 1);
        }
        // Increment new option count
        redisTemplate.opsForHash().increment(pollVotesKey, String.valueOf(newOptionId), 1);

        // 5. Construct Vote Event for Async Processing to DB
        VoteEventDTO voteEvent = VoteEventDTO.builder()
                .userId(userId)
                .pollId(pollId)
                .optionId(newOptionId)
                .oldOptionId(oldOptionId)
                .timestamp(now)
                .build();
        
        try {
            String eventJson = objectMapper.writeValueAsString(voteEvent);
            redisTemplate.opsForList().leftPush(RedisKeyUtils.getVoteEventQueueKey(), eventJson);
        } catch (Exception e) {
            throw new RuntimeException("Failed to queue vote event", e);
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
            return com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO.builder()
                    .hasVoted(true)
                    .optionId(Long.parseLong(optionIdObj.toString()))
                    .build();
        }

        // Fallback to database if redis key was cleared or not populated yet
        return voteRepository.findByUserIdAndPollId(userId, pollId)
                .map(vote -> {
                    // Backfill Redis so next time it's fast
                    redisTemplate.opsForHash().put(userVotesKey, String.valueOf(userId), String.valueOf(vote.getOption().getId()));
                    return com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO.builder()
                            .hasVoted(true)
                            .optionId(vote.getOption().getId())
                            .build();
                })
                .orElse(com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO.builder()
                        .hasVoted(false)
                        .build());
    }
}
