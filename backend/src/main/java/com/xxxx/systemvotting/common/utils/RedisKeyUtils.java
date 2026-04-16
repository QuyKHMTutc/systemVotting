package com.xxxx.systemvotting.common.utils;

public class RedisKeyUtils {
    
    // Votes for each option in a poll (Hash: optionId -> count)
    public static String getPollVotesKey(Long pollId) {
        return "poll:" + pollId + ":votes";
    }

    // User's vote in a specific poll (Hash: userId -> optionId)
    public static String getPollUserVotesKey(Long pollId) {
        return "poll:" + pollId + ":user_votes";
    }

    // Rate Limiting (String: count)
    public static String getRateLimitKey(Long userId) {
        return "rate_limit:vote:user:" + userId;
    }

    // Global Hot Polls Ranking (ZSet: pollId -> score)
    public static String getPollRankingKey() {
        return "ranking:polls:hot";
    }

    // Async Work Queue (List of VoteEventDTO JSON strings)
    public static String getVoteEventQueueKey() {
        return "queue:vote_events";
    }
}
