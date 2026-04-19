package com.xxxx.systemvotting.modules.comment.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Invalidates all Spring-Cache {@code comments} entries for a poll after any write.
 * Keys are shaped {@code comments::<pollId>:<page>:<size>} (see {@code @Cacheable} SpEL).
 */
@Component
@RequiredArgsConstructor
public class CommentCacheInvalidator {

    private static final String CACHE_NAME = "comments";

    private final StringRedisTemplate stringRedisTemplate;

    public void evictAllPagesForPoll(Long pollId) {
        String legacyKey = CACHE_NAME + "::" + pollId;
        stringRedisTemplate.delete(legacyKey);

        String pattern = CACHE_NAME + "::" + pollId + ":*";
        ScanOptions options = ScanOptions.scanOptions().match(pattern).count(128).build();

        Set<String> keys = new HashSet<>();
        try (Cursor<String> cursor = stringRedisTemplate.scan(options)) {
            while (cursor.hasNext()) {
                keys.add(cursor.next());
            }
        }
        if (!keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
        }
    }
}
