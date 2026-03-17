package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.exception.custom.RateLimitExceededException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final RedisTemplate<String, String> redisTemplate;

    // Configuration: Max 5 votes per minute per user 
    private static final int MAX_VOTES_PER_WINDOW = 5;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    /**
     * Checks if the user is allowed to vote based on rate limiting rules.
     * Throws an exception if the limit is exceeded.
     */
    public void checkAndRecordVoteAttempt(Long userId) {
        String key = RedisKeyUtils.getRateLimitKey(userId);
        
        Long currentCount = redisTemplate.opsForValue().increment(key);
        
        if (currentCount != null && currentCount == 1L) {
            // First time voting in this window, set expiration
            redisTemplate.expire(key, WINDOW_DURATION);
        }

        if (currentCount != null && currentCount > MAX_VOTES_PER_WINDOW) {
            log.warn("Rate limit exceeded for user: {}. Current count: {}", userId, currentCount);
            throw new RateLimitExceededException("Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút.");
        }
    }
}
