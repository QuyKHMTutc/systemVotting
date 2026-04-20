package com.xxxx.systemvotting.modules.vote.job;

import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisDbSyncJob {

    private final StringRedisTemplate stringRedisTemplate;
    private final PollRepository pollRepository;

    /** Matches {@link RedisKeyUtils#getPollVotesKey(Long)} pattern {@code poll:{id}:votes}. */
    private static final String POLL_VOTES_KEY_GLOB = "poll:*:votes";

    /**
     * Nightly job: align option vote_count in DB with Redis hashes for polls that actually
     * have vote state in Redis. Avoids loading the entire {@code polls} table (important on dev laptops
     * and as data grows).
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void syncRedisVotesToDatabase() {
        log.info("Starting nightly Redis → DB vote sync (keys matching {})...", POLL_VOTES_KEY_GLOB);

        Set<Long> pollIds = collectPollIdsFromRedisVoteKeys();
        if (pollIds.isEmpty()) {
            log.info("No Redis vote hash keys found; nothing to sync.");
            return;
        }

        List<Poll> polls = pollRepository.findAllById(pollIds);
        int updatedCount = 0;

        for (Poll poll : polls) {
            String redisCountKey = RedisKeyUtils.getPollVotesKey(poll.getId());
            Map<Object, Object> redisVotes = stringRedisTemplate.opsForHash().entries(redisCountKey);

            if (redisVotes == null || redisVotes.isEmpty()) {
                continue;
            }

            boolean isUpdated = false;
            for (var option : poll.getOptions()) {
                String optionIdStr = option.getId().toString();
                if (!redisVotes.containsKey(optionIdStr)) {
                    continue;
                }
                Object raw = redisVotes.get(optionIdStr);
                int trueRedisCount = parseVoteCount(raw);
                if (option.getVoteCount() == null || option.getVoteCount() != trueRedisCount) {
                    option.setVoteCount(trueRedisCount);
                    isUpdated = true;
                }
            }

            if (isUpdated) {
                pollRepository.save(poll);
                updatedCount++;
            }
        }

        log.info("Completed Redis → DB vote sync. Polls examined: {}, updated: {}.",
                polls.size(), updatedCount);
    }

    private Set<Long> collectPollIdsFromRedisVoteKeys() {
        Set<Long> pollIds = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions()
                .match(POLL_VOTES_KEY_GLOB)
                .count(500)
                .build();

        try (Cursor<String> cursor = stringRedisTemplate.scan(options)) {
            while (cursor.hasNext()) {
                Long id = parsePollIdFromVotesKey(cursor.next());
                if (id != null) {
                    pollIds.add(id);
                }
            }
        }
        return pollIds;
    }

    private static Long parsePollIdFromVotesKey(String key) {
        if (key == null || !key.startsWith("poll:") || !key.endsWith(":votes")) {
            return null;
        }
        String middle = key.substring("poll:".length(), key.length() - ":votes".length());
        if (middle.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(middle);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static int parseVoteCount(Object raw) {
        if (raw == null) {
            return 0;
        }
        if (raw instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(raw.toString().trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
