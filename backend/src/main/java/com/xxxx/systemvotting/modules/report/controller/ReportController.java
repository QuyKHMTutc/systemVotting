package com.xxxx.systemvotting.modules.report.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.report.dto.ReportRequest;
import com.xxxx.systemvotting.modules.report.dto.ReportResponse;
import com.xxxx.systemvotting.modules.report.dto.ReportStatusUpdateRequest;
import com.xxxx.systemvotting.modules.report.enums.ReportStatus;
import com.xxxx.systemvotting.modules.report.enums.ReportTargetType;
import com.xxxx.systemvotting.modules.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // User API
    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(@Valid @RequestBody ReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ReportResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Báo cáo thành công")
                        .data(response)
                        .build());
    }

    // Admin APIs
    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<ReportResponse> reports = reportService.getAllReports(status, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<ReportResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách báo cáo thành công")
                .data(reports)
                .build());
    }

    @GetMapping("/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable Long id) {
        ReportResponse report = reportService.getReportById(id);
        return ResponseEntity.ok(ApiResponse.<ReportResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy chi tiết báo cáo thành công")
                .data(report)
                .build());
    }

    @PutMapping("/admin/reports/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportStatusUpdateRequest request) {
        ReportResponse updatedReport = reportService.updateReportStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.<ReportResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cập nhật trạng thái báo cáo thành công")
                .data(updatedReport)
                .build());
    }
}
