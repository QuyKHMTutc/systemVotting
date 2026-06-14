package com.xxxx.systemvotting.modules.report.dto;

import com.xxxx.systemvotting.modules.report.enums.ReportReasonType;
import com.xxxx.systemvotting.modules.report.enums.ReportStatus;
import com.xxxx.systemvotting.modules.report.enums.ReportTargetType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    
    private ReportTargetType targetType;
    private Long targetId;
    private String targetSnippet; // Nội dung trích dẫn (VD: tiêu đề poll hoặc nội dung comment)
    
    private ReportReasonType reasonType;
    private String description;
    private ReportStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
