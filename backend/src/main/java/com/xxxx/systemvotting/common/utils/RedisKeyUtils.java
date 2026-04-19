package com.xxxx.systemvotting.common.utils;

/**
 * Centralized Redis key namespace for the vote module.
 *
 * Key format conventions (Redis community standard):
 *   {entity}:{id}:{attribute}   for entity-scoped keys
 *   {domain}:{entity}:{id}      for domain-grouped keys
 *
 * All keys are immutable string templates — no mutable state.
 * Utility class: not instantiable.
 */
public final class RedisKeyUtils {

    private RedisKeyUtils() {}  // prevent instantiation

    /** Hash: optionId → voteCount. Stores live vote counts per option. */
    public static String getPollVotesKey(Long pollId) {
        return "poll:" + pollId + ":votes";
    }

    /** Hash: userId → optionId. Tracks each user's current vote in a poll. */
    public static String getPollUserVotesKey(Long pollId) {
        return "poll:" + pollId + ":user_votes";
    }

    /** String: sliding-window INCR counter for rate limiting vote submissions. */
    public static String getRateLimitKey(Long userId) {
        return "rate_limit:vote:user:" + userId;
    }

    /** ZSet: pollId → score. Sorted set backing the "Hot Polls" ranking feature. */
    public static String getPollRankingKey() {
        return "ranking:polls:hot";
    }

    /** List: JSON-serialized VoteEventDTO strings queued for async DB persistence. */
    public static String getVoteEventQueueKey() {
        return "queue:vote_events";
    }
}
