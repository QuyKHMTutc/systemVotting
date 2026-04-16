package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final RedisTemplate<String, String> redisTemplate;

    // Configuration: Max 5 votes per minute per user 
    private static final int MAX_VOTES_PER_WINDOW = 5;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    private static final String RATE_LIMIT_LUA =
            "local count = redis.call('INCR', KEYS[1]) " +
            "if count == 1 then " +
            "    redis.call('EXPIRE', KEYS[1], ARGV[1]) " +
            "end " +
            "return count";

    private final RedisScript<Long> rateLimitScript = new DefaultRedisScript<>(RATE_LIMIT_LUA, Long.class);

    /**
     * Checks if the user is allowed to vote based on rate limiting rules.
     * Throws an exception if the limit is exceeded.
     */
    public void checkAndRecordVoteAttempt(Long userId) {
        String key = RedisKeyUtils.getRateLimitKey(userId);
        
        Long currentCount = redisTemplate.execute(
                rateLimitScript,
                Collections.singletonList(key),
                String.valueOf(WINDOW_DURATION.getSeconds())
        );

        if (currentCount != null && currentCount > MAX_VOTES_PER_WINDOW) {
            log.warn("Rate limit exceeded for user: {}. Current count: {}", userId, currentCount);
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }
    }
}
