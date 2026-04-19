package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;

/**
 * Contract for vote submission and status checking.
 *
 * Implementations must be thread-safe — submitVote() is on the hot path
 * for 2000+ concurrent requests.
 */
public interface VoteService {

    /**
     * Submits a vote for the given option. Enforces rate limiting, time window,
     * and plan-based capacity constraints. DB persistence is async via Redis queue.
     *
     * @param userId    authenticated user's ID (injected by controller from JWT, not from request body)
     * @param pollId    target poll ID
     * @param optionId  chosen option ID
     * @return vote summary DTO
     */
    VoteResponseDTO submitVote(Long userId, Long pollId, Long optionId);

    /**
     * Checks whether the authenticated user has already voted on the given poll.
     * Reads from Redis first (cache-aside), falls back to DB on miss.
     */
    VoteCheckResponseDTO checkVote(Long userId, Long pollId);
}
