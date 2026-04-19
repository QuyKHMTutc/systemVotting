package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * Enforces a sliding-window rate limit on vote submissions per user.
 *
 * Strategy: Atomic Redis INCR + EXPIRE via Lua to avoid TOCTOU race conditions.
 * Config:   Max 5 votes per 60-second window per user.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final StringRedisTemplate stringRedisTemplate;   // ← explicit type, no FQCN inline

    private static final int      MAX_VOTES_PER_WINDOW = 5;
    private static final Duration WINDOW_DURATION      = Duration.ofMinutes(1);

    /**
     * Lua ensures INCR + EXPIRE are atomic (no race between two concurrent first-voters).
     * Returns the current count for this window.
     */
    private static final String RATE_LIMIT_LUA = """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """;

    // Compiled once at startup — RedisScript is thread-safe and reusable
    private final RedisScript<Long> rateLimitScript =
            new DefaultRedisScript<>(RATE_LIMIT_LUA, Long.class);

    /**
     * Increments the user's attempt counter and throws {@link AppException}
     * with {@code RATE_LIMIT_EXCEEDED} if the limit is breached.
     *
     * @param userId the authenticated user's ID
     * @throws AppException if the user has exceeded the vote rate limit
     */
    public void checkAndRecordVoteAttempt(Long userId) {
        String key   = RedisKeyUtils.getRateLimitKey(userId);
        Long   count = stringRedisTemplate.execute(
                rateLimitScript,
                List.of(key),
                String.valueOf(WINDOW_DURATION.getSeconds())
        );

        if (count != null && count > MAX_VOTES_PER_WINDOW) {
            log.warn("Rate limit exceeded: userId={}, count={}/{}", userId, count, MAX_VOTES_PER_WINDOW);
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }
    }
}
