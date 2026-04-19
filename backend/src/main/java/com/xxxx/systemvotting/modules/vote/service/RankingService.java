package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Manages a Redis Sorted Set that tracks poll popularity scores.
 * Used to power "Hot Polls" rankings on the explore page.
 *
 * Key: {@code ranking:polls:hot}
 * Member: poll ID (as String)
 * Score:  cumulative vote count (incremented on every unique first vote)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

    private final StringRedisTemplate stringRedisTemplate;   // ← explicit type

    /**
     * Increments a poll's hot score by {@code delta}.
     * Called only on brand-new votes (not vote changes) to reflect unique voter engagement.
     *
     * @param pollId the poll to promote in rankings
     * @param delta  score increment (typically 1.0)
     */
    public void incrementPollScore(Long pollId, double delta) {
        stringRedisTemplate.opsForZSet()
                .incrementScore(RedisKeyUtils.getPollRankingKey(), String.valueOf(pollId), delta);
    }

    /**
     * Returns the IDs of the top {@code limit} polls by score, highest first.
     *
     * @param limit maximum number of poll IDs to return
     * @return ordered set of poll ID strings, or empty set if none exist
     */
    public Set<String> getTopPolls(long limit) {
        return stringRedisTemplate.opsForZSet()
                .reverseRange(RedisKeyUtils.getPollRankingKey(), 0, limit - 1);
    }
}
