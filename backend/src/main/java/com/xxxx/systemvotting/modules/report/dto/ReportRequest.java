package com.xxxx.systemvotting.modules.report.dto;

import com.xxxx.systemvotting.modules.report.enums.ReportReasonType;
import com.xxxx.systemvotting.modules.report.enums.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "Target type is required")
    private ReportTargetType targetType;

    @NotNull(message = "Target ID is required")
    @Positive(message = "Target ID must be positive")
    private Long targetId;

    @NotNull(message = "Reason type is required")
    private ReportReasonType reasonType;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
