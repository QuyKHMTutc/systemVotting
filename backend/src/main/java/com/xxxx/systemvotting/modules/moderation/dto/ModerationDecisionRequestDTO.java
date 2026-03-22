package com.xxxx.systemvotting.modules.moderation.dto;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModerationDecisionRequestDTO {
    @NotNull(message = "Decision is required")
    private ModerationStatus decision;
}
