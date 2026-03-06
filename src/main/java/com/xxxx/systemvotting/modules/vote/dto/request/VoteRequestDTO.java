package com.xxxx.systemvotting.modules.vote.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VoteRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Poll ID is required")
    private Long pollId;

    @NotNull(message = "Option ID is required")
    private Long optionId;

}
