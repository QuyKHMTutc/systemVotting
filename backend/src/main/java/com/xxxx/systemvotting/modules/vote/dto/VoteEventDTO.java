package com.xxxx.systemvotting.modules.vote.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Internal event pushed to the Redis async queue by VoteServiceImpl (via Lua script)
 * and consumed by VoteEventConsumer for DB persistence.
 *
 * {@code oldOptionId} semantics:
 *   - {@code null}  → brand-new vote (no previous selection)
 *   - non-null      → vote change (decrement old option count in DB)
 *
 * Serialization: JSON via Jackson (ObjectMapper in VoteServiceImpl).
 * The Lua script replaces the sentinel value {@code "-999"} with the real
 * {@code oldOptionId} atomically before pushing to the queue.
 */
@Builder
public record VoteEventDTO(

    Long pollId,
    Long optionId,
    Long userId,

    @JsonProperty("oldOptionId")
    Long oldOptionId,

    LocalDateTime timestamp

) implements Serializable {}
