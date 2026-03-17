package com.xxxx.systemvotting.modules.vote.job;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisDbSyncJob {

    private final RedisTemplate<String, Object> redisTemplate;
    private final PollRepository pollRepository;

    /**
     * Nightly job to sync Redis vote counts to DB to ensure eventual consistency.
     * Runs at 3:00 AM every day.
     */
    @Scheduled(cron = "0 0 3 * * ?") // Every day at 3 AM
    @Transactional
    public void syncRedisVotesToDatabase() {
        log.info("Starting nightly Redis to DB sync job...");

        // Strategy to get all polls, or we can use SET in redis to track active polls
        List<Poll> activePolls = pollRepository.findAll(); // Optimization: find polls active recently

        HashOperations<String, String, Integer> hashOps = redisTemplate.opsForHash();

        int updatedCount = 0;
        for (Poll poll : activePolls) {
            String redisCountKey = RedisKeyUtils.getPollVotesKey(poll.getId());
            
            // Note: Option IDs in Redis are stored as Strings due to Jackson, we need to handle that.
            Map<String, Integer> redisVotes = hashOps.entries(redisCountKey);

            if (redisVotes != null && !redisVotes.isEmpty()) {
                boolean isUpdated = false;
                for (var option : poll.getOptions()) {
                    String optionIdStr = option.getId().toString();
                    if (redisVotes.containsKey(optionIdStr)) {
                        Integer redisCount = redisVotes.get(optionIdStr);
                        // Convert Integer from Redis map (which may be deserialized as Integer/Long)
                        int trueRedisCount = redisCount != null ? redisCount.intValue() : 0;
                        
                        // Compare and update if different format. The async worker should have updated DB,
                        // this acts as a true fallback to correct drift.
                        if (option.getVoteCount() == null || option.getVoteCount() != trueRedisCount) {
                            option.setVoteCount(trueRedisCount);
                            isUpdated = true;
                        }
                    }
                }

                if (isUpdated) {
                    pollRepository.save(poll);
                    updatedCount++;
                }
            }
        }

        log.info("Completed nightly Redis to DB sync job. Polls updated: {}", updatedCount);
    }
}
