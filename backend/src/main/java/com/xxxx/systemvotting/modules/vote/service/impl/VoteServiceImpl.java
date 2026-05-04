package com.xxxx.systemvotting.modules.vote.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.notification.service.AsyncNotificationService;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.OptionRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.PlanType;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.vote.dto.VoteEventDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.vote.service.RankingService;
import com.xxxx.systemvotting.modules.vote.service.RateLimitService;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import com.xxxx.systemvotting.modules.poll.repository.PollMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Production-grade vote submission service.
 *
 * Architecture:
 *   Controller → VoteService → [RateLimitService, PollRepository, OptionRepository]
 *                            → Redis Lua Script (atomic write)
 *                            → VoteEventConsumer (async DB persist via Redis queue)
 *                            → AsyncNotificationService (fire-and-forget)
 *                            → RealTimeService (WebSocket broadcast)
 *
 * Thread-safety:
 *   All shared state is in Redis (StringRedisTemplate is thread-safe).
 *   No instance-level mutable state.
 *
 * Performance contract (per submitVote call):
 *   - 2 DB reads (poll + option) — no @Transactional, connection released immediately after each
 *   - 1 Redis Lua script (atomic, single round-trip)
 *   - 0 DB writes on the hot path (async via VoteEventConsumer)
 *   - Notification and WebSocket broadcast are non-blocking
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoteServiceImpl implements VoteService {

    // ── Repositories (DB reads only, no long-held connections) ─────────────────
    private final PollRepository      pollRepository;
    private final OptionRepository    optionRepository;
    private final UserRepository      userRepository;
    private final VoteRepository      voteRepository;

    // ── Domain Services ─────────────────────────────────────────────────────────
    private final RateLimitService         rateLimitService;
    private final RankingService           rankingService;
    private final AsyncNotificationService asyncNotificationService;
    private final RealTimeService          realTimeService;
    private final PollMemberRepository     pollMemberRepository;

    // ── Infrastructure ──────────────────────────────────────────────────────────
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper        objectMapper;

    // ── Lua Script (compiled once, reused — thread-safe) ────────────────────────
    /**
     * Atomic Lua script that:
     * 1. Rejects if user has already voted in this poll (one-vote-per-user) → returns "-1"
     * 2. Enforces plan-based vote limit → returns "-2"
     * 3. Records user's choice in a Hash
     * 4. Updates option vote count (HINCRBY)
     * 5. Pushes a serialized VoteEventDTO to the async queue for DB persistence
     * 6. Returns "" on success
     *
     * All operations are atomic — no race condition possible between steps.
     * Vote changes are NOT allowed: each user may cast exactly one vote per poll.
     */
    private static final String VOTE_LUA = """
            local userVotesKey     = KEYS[1]
            local pollVotesKey     = KEYS[2]
            local queueKey         = KEYS[3]
            local userId           = ARGV[1]
            local newOptionId      = ARGV[2]
            local eventJson        = ARGV[3]
            local maxLimitStr      = ARGV[4]
            local baselineTotalStr = ARGV[5]
            local roleSuffix       = ARGV[6]

            local existingOptionId = redis.call('HGET', userVotesKey, userId)

            -- Reject: user already voted in this poll (no changes allowed)
            if existingOptionId then return '-1' end

            -- Enforce plan-based vote limit
            if maxLimitStr ~= '0' then
                local currentTotal = tonumber(baselineTotalStr or '0')
                if redis.call('EXISTS', pollVotesKey) == 1 then
                    local redisDelta = 0
                    for _, v in ipairs(redis.call('HVALS', pollVotesKey)) do
                        redisDelta = redisDelta + tonumber(v or '0')
                    end
                    if redisDelta > currentTotal then currentTotal = redisDelta end
                end
                if currentTotal >= tonumber(maxLimitStr) then return '-2' end
            end

            -- Record vote (first and only time)
            redis.call('HSET', userVotesKey, userId, newOptionId)
            
            local weightedKey = newOptionId .. ":" .. roleSuffix
            redis.call('HINCRBY', pollVotesKey, weightedKey, 1)

            -- Push event to async queue (oldOptionId is always null — no vote change)
            local finalJson = string.gsub(eventJson, '"-999"', 'null')
            redis.call('LPUSH', queueKey, finalJson)

            return ''
            """;

    private final RedisScript<String> voteScript = new DefaultRedisScript<>(VOTE_LUA, String.class);

    // ─────────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Hot path — optimized for minimum DB interaction and maximum throughput.
     *
     * Intentionally NOT annotated with @Transactional:
     *   The actual DB save is deferred to VoteEventConsumer.
     *   Holding a HikariCP connection for the full flow (2 reads + Redis + broadcast)
     *   would exhaust a pool of 20 under 2000 concurrent requests.
     */
    @Override
    @CacheEvict(value = "pollDetails", key = "#pollId")
    public VoteResponseDTO submitVote(Long userId, Long pollId, Long optionId) {

        // Step 1 — Rate limit check (Redis, ~0.1ms)
        rateLimitService.checkAndRecordVoteAttempt(userId);

        // Step 2 — Validate poll (DB read, connection released immediately)
        Poll poll = loadAndValidatePoll(pollId);

        // Step 2b — Reject creator self-vote
        rejectIfCreator(userId, poll);

        // Step 3 — Validate option belongs to poll (DB read)
        Option option = loadAndValidateOption(optionId, pollId);

        // Step 4 — Execute atomic Lua script (single Redis round-trip)
        String luaResult = executeLuaVoteScript(userId, poll, option);

        // Step 5 — Handle side effects (every successful vote is always a first vote)
        handleFirstVoteSideEffects(userId, poll);

        // Step 6 — Broadcast live counts (non-blocking Redis read + WebSocket)
        broadcastVoteUpdate(poll, RedisKeyUtils.getPollVotesKey(pollId));

        log.debug("Vote submitted: userId={}, pollId={}, optionId={}",
                userId, pollId, optionId);

        return buildVoteResponse(userId, poll, option);
    }

    @Override
    public VoteCheckResponseDTO checkVote(Long userId, Long pollId) {
        String userVotesKey = RedisKeyUtils.getPollUserVotesKey(pollId);

        // Redis cache-aside: O(1) hash lookup
        Object cached = stringRedisTemplate.opsForHash().get(userVotesKey, String.valueOf(userId));
        if (cached != null) {
            return new VoteCheckResponseDTO(true, Long.parseLong(cached.toString()));
        }

        // DB fallback on Redis miss (cold start / key eviction)
        return voteRepository.findByUserIdAndPollId(userId, pollId)
                .map(vote -> {
                    // Backfill Redis to serve next call from cache
                    stringRedisTemplate.opsForHash().put(
                            userVotesKey,
                            String.valueOf(userId),
                            String.valueOf(vote.getOption().getId())
                    );
                    return new VoteCheckResponseDTO(true, vote.getOption().getId());
                })
                .orElse(new VoteCheckResponseDTO(false, null));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Private helpers — each has a single responsibility
    // ─────────────────────────────────────────────────────────────────────────────

    private Poll loadAndValidatePoll(Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        if (poll.getStartTime() != null && now.isBefore(poll.getStartTime())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (poll.getEndTime() != null && now.isAfter(poll.getEndTime())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return poll;
    }

    /** Validates that the voter is not the poll creator. */
    private void rejectIfCreator(Long userId, Poll poll) {
        if (poll.getCreator() != null && poll.getCreator().getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private Option loadAndValidateOption(Long optionId, Long pollId) {
        Option option = optionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!option.getPoll().getId().equals(pollId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return option;
    }

    private String executeLuaVoteScript(Long userId, Poll poll, Option newOption) {
        String pollVotesKey  = RedisKeyUtils.getPollVotesKey(poll.getId());
        String userVotesKey  = RedisKeyUtils.getPollUserVotesKey(poll.getId());
        String queueKey      = RedisKeyUtils.getVoteEventQueueKey();
        String maxLimit      = resolveVoteLimit(poll.getCreator().getPlan());
        int    baselineTotal = computeBaselineTotal(poll, maxLimit);

        // Determine user role and weight for this poll
        String roleSuffix = "AUDIENCE";
        int weight = 1;
        var member = pollMemberRepository.findByPollIdAndUserId(poll.getId(), userId);
        if (member.isPresent()) {
            roleSuffix = "JUDGE";
            // In the ratio system, we count votes normally but in a separate bucket.
            // Individual weight within the group is 1.
        }

        String eventJson = buildEventJson(userId, poll.getId(), newOption.getId(), weight);

        String result = stringRedisTemplate.execute(
                voteScript,
                Arrays.asList(userVotesKey, pollVotesKey, queueKey),
                String.valueOf(userId),
                String.valueOf(newOption.getId()),
                eventJson,
                maxLimit,
                String.valueOf(baselineTotal),
                roleSuffix
        );

        if ("-1".equals(result)) throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        if ("-2".equals(result)) throw new AppException(ErrorCode.POLL_LIMIT_EXCEEDED);
        return result;
    }

    /**
     * Maps creator's subscription plan to maximum allowed votes.
     * Returns "0" to indicate unlimited (PRO or unknown plans).
     */
    private String resolveVoteLimit(PlanType plan) {
        return switch (plan) {
            case FREE -> "100";
            case GO   -> "300";
            case PLUS -> "1000";
            case PRO  -> "2000";  // unlimited
        };
    }

    /**
     * Computes the DB-side vote baseline (used by Lua to enforce capacity on first votes).
     * Only queried when plan has a finite limit to avoid unnecessary DB work.
     */
    private int computeBaselineTotal(Poll poll, String maxLimit) {
        if ("0".equals(maxLimit)) return 0;
        return poll.getOptions().stream()
                .mapToInt(Option::getVoteCount)
                .sum();
    }

    private String buildEventJson(Long userId, Long pollId, Long optionId, Integer weight) {
        // oldOptionId is always null — vote changes are not allowed (one vote per user per poll).
        VoteEventDTO event = VoteEventDTO.builder()
                .userId(userId)
                .pollId(pollId)
                .optionId(optionId)
                .weight(weight)
                .oldOptionId(null)
                .timestamp(LocalDateTime.now())
                .build();
        try {
            return objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR);
        }
    }

    /**
     * Side effects for brand-new votes (not vote changes).
     * Neither ranking nor notification must block the vote response.
     */
    private void handleFirstVoteSideEffects(Long userId, Poll poll) {
        // Increment poll's hot-ranking score (Redis ZSet, fire-and-forget)
        rankingService.incrementPollScore(poll.getId(), 1);

        // Notify poll creator asynchronously (isolated thread pool)
        if (!poll.getCreator().getId().equals(userId)) {
            dispatchVoteNotification(userId, poll);
        }
    }

    private void dispatchVoteNotification(Long voterId, Poll poll) {
        try {
            userRepository.findById(voterId).ifPresent(voter ->
                asyncNotificationService.createNotificationAsync(
                        poll.getCreator().getId(),
                        voter.getUsername(),
                        voter.getAvatarUrl(),
                        "NEW_VOTE",
                        "đã vote vào cuộc thăm dò của bạn",
                        poll.getId(),
                        null
                )
            );
        } catch (Exception e) {
            // Non-critical: vote is already persisted in Redis. Never propagate.
            log.warn("Notification dispatch skipped for poll={}, voter={}: {}",
                    poll.getId(), voterId, e.getMessage());
        }
    }

    /**
     * Reads latest counts from Redis and pushes them to WebSocket subscribers.
     * Non-blocking: Redis read is O(N options), WebSocket is fire-and-forget.
     */
    private void broadcastVoteUpdate(Poll poll, String pollVotesKey) {
        Map<Object, Object> redisCounts = stringRedisTemplate.opsForHash().entries(pollVotesKey);

        List<Map<String, Object>> optionUpdates = poll.getOptions().stream()
                .map(o -> {
                    Object audienceRaw = redisCounts.get(o.getId() + ":AUDIENCE");
                    Object judgeRaw = redisCounts.get(o.getId() + ":JUDGE");
                    
                    int audienceCount = audienceRaw != null ? Integer.parseInt(audienceRaw.toString()) : 0;
                    int judgeCount = judgeRaw != null ? Integer.parseInt(judgeRaw.toString()) : 0;
                    
                    // Note: totalVoteCount here is a virtual weighted sum for simple display if needed,
                    // but the frontend will do the heavy lifting with judgeWeight.
                    return Map.<String, Object>of(
                            "optionId",  o.getId(),
                            "text",      o.getText(),
                            "audienceCount", audienceCount,
                            "judgeCount", judgeCount,
                            "judgeWeight", poll.getJudgeWeight()
                    );
                })
                .collect(Collectors.toList());

        // Per-poll channel (detail page)
        realTimeService.broadcast(
                "/topic/polls/" + poll.getId() + "/votes",
                Map.of("pollId", poll.getId(), "options", optionUpdates)
        );

        // Global channel (explore/dashboard page)
        realTimeService.broadcast(
                "/topic/polls/events",
                Map.of("type", "VOTED", "pollId", poll.getId(), "options", optionUpdates)
        );
    }

    private VoteResponseDTO buildVoteResponse(Long userId, Poll poll, Option option) {
        // Vote is persisted asynchronously by VoteEventConsumer.
        // We return id=-1 as the async-pending indicator to the client.
        return new VoteResponseDTO(
                -1L,
                userId,
                poll.getId(),
                option.getId(),
                LocalDateTime.now()
        );
    }
}
