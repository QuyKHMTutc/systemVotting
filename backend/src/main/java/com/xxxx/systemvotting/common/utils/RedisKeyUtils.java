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

    /** String: sliding-window INCR counter for rate limiting comment submissions. */
    public static String getCommentRateLimitKey(Long userId) {
        return "rate_limit:comment:user:" + userId;
    }

    /** String: sliding-window INCR counter for rate limiting chatbot submissions. */
    public static String getChatbotRateLimitKey(String identifier) {
        return "rate_limit:chatbot:" + identifier;
    }

    /** ZSet: pollId → score. Sorted set backing the "Hot Polls" ranking feature. */
    public static String getPollRankingKey() {
        return "ranking:polls:hot";
    }

    /** List: JSON-serialized VoteEventDTO strings queued for async DB persistence. */
    public static String getVoteEventQueueKey() {
        return "queue:vote_events";
    }

    /**
     * Set: pollId strings. Tracks all polls a specific user has voted on (pending DB flush).
     * Written atomically in the Lua vote script alongside the per-poll user_votes hash.
     * Used by getVotedPolls to include Redis-pending votes not yet flushed to DB.
     */
    public static String getUserVotedPollsKey(Long userId) {
        return "user:" + userId + ":voted_polls";
    }
}
