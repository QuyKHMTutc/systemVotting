package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

    private final RedisTemplate<String, String> redisTemplate;

    /**
     * Increments the total score (vote count) for a poll in the ranking logic.
     */
    public void incrementPollScore(Long pollId, double delta) {
        String key = RedisKeyUtils.getPollRankingKey();
        redisTemplate.opsForZSet().incrementScore(key, String.valueOf(pollId), delta);
    }

    /**
     * Fetches the IDs of the top N most voted/active polls.
     */
    public Set<String> getTopPolls(long limit) {
        String key = RedisKeyUtils.getPollRankingKey();
        // Range from 0 to limit-1 (0-indexed) backwards (highest score first)
        return redisTemplate.opsForZSet().reverseRange(key, 0, limit - 1);
    }
}
