package com.xxxx.systemvotting.modules.report.dto;

import com.xxxx.systemvotting.modules.report.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ReportStatus status;
}
