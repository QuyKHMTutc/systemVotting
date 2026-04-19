package com.xxxx.systemvotting.modules.vote.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for vote submission.
 *
 * userId is intentionally ABSENT — it is extracted from the JWT token
 * by VoteController and passed directly to VoteService.
 * Including userId here would create an IDOR vulnerability.
 */
public record VoteRequestDTO(

    @NotNull(message = "Poll ID is required")
    @Positive(message = "Poll ID must be a positive number")
    Long pollId,

    @NotNull(message = "Option ID is required")
    @Positive(message = "Option ID must be a positive number")
    Long optionId

) {}
