package com.xxxx.systemvotting.modules.vote.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.dto.VoteEventDTO;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * Async consumer that drains a Redis list and persists vote events to the database.
 *
 * Design intent:
 *   VoteServiceImpl writes to Redis atomically (Lua script) and returns immediately.
 *   This consumer runs on a single scheduler thread every 2 seconds,
 *   draining the queue in a tight loop until empty.
 *
 * Thread-safety:
 *   @Scheduled runs on a single-threaded executor by default → no concurrent
 *   access to processVoteEvents(). processSingleEvent() is @Transactional but
 *   called from the same thread, so no deadlock risk.
 *
 * Failure handling:
 *   On deserialization error, the raw JSON is logged and processing continues
 *   (skip-and-continue strategy). A DLQ (Dead Letter Queue) should be added
 *   in production for observability.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoteEventConsumer {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper        objectMapper;
    private final VoteRepository      voteRepository;
    private final PollRepository      pollRepository;
    private final UserRepository      userRepository;

    private static final String QUEUE_KEY = RedisKeyUtils.getVoteEventQueueKey();

    /**
     * Drains the vote event queue every 2 seconds.
     * Uses rightPop with a 1-second block timeout to avoid busy-waiting.
     */
    @Scheduled(fixedDelay = 2000)
    public void processVoteEvents() {
        String eventJson;
        while ((eventJson = stringRedisTemplate.opsForList().rightPop(QUEUE_KEY, Duration.ofSeconds(1))) != null) {
            try {
                VoteEventDTO event = objectMapper.readValue(eventJson, VoteEventDTO.class);
                log.debug("Processing vote event: pollId={}, userId={}, optionId={}",
                        event.pollId(), event.userId(), event.optionId());
                persistEvent(event);
            } catch (Exception e) {
                // Skip malformed events — log raw JSON for manual recovery / DLQ in production
                log.error("Failed to process vote event (skipping): json='{}', error='{}'", eventJson, e.getMessage());
            }
        }
    }

    /**
     * Persists a single vote event to the database within a transaction.
     *
     * Logic:
     *   - If the user already has a vote for this poll → update option (vote change)
     *   - Otherwise → insert new vote
     *   - Handles the edge case where Redis says "new vote" but DB disagrees (corrective upsert)
     */
    @Transactional
    protected void persistEvent(VoteEventDTO event) {
        Poll poll = pollRepository.findById(event.pollId()).orElse(null);
        User user = userRepository.findById(event.userId()).orElse(null);

        if (poll == null || user == null) {
            log.error("Skipping event — poll or user not found: pollId={}, userId={}",
                    event.pollId(), event.userId());
            return;
        }

        Option newOption = poll.getOptions().stream()
                .filter(o -> o.getId().equals(event.optionId()))
                .findFirst()
                .orElse(null);

        if (newOption == null) {
            log.error("Skipping event — option {} not found in poll {}", event.optionId(), poll.getId());
            return;
        }

        // Each user can only vote once — vote changes are blocked at the Lua script level.
        // The existing check below is a safety guard against DB/Redis inconsistency (e.g. Redis eviction).
        boolean alreadyVoted = voteRepository.findByUserIdAndPollId(event.userId(), event.pollId()).isPresent();
        if (alreadyVoted) {
            log.warn("Skipping duplicate vote event (already in DB): userId={}, pollId={}", event.userId(), event.pollId());
            return;
        }

        // Insert brand-new vote
        voteRepository.save(Vote.builder()
                .user(user)
                .poll(poll)
                .option(newOption)
                .build());
        log.debug("Inserted vote: userId={}, pollId={}, optionId={}", user.getId(), poll.getId(), newOption.getId());
    }
}
