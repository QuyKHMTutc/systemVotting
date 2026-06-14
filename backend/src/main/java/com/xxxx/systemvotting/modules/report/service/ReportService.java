package com.xxxx.systemvotting.modules.report.service;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.modules.report.dto.ReportRequest;
import com.xxxx.systemvotting.modules.report.dto.ReportResponse;
import com.xxxx.systemvotting.modules.report.entity.Report;
import com.xxxx.systemvotting.modules.report.enums.ReportStatus;
import com.xxxx.systemvotting.modules.report.enums.ReportTargetType;
import com.xxxx.systemvotting.modules.report.repository.ReportRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PollRepository pollRepository;
    private final CommentRepository commentRepository;
    private final PollService pollService;
    private final CommentService commentService;

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        Long userId = Long.valueOf(SecurityContextHolder.getContext().getAuthentication().getName());
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        validateTarget(request, reporter.getId());

        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(
                reporter.getId(), request.getTargetType(), request.getTargetId())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reasonType(request.getReasonType())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        return mapToResponse(savedReport);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getAllReports(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
        Page<Report> reports;
        if (status != null && targetType != null) {
            reports = reportRepository.findByStatusAndTargetType(status, targetType, pageable);
        } else if (status != null) {
            reports = reportRepository.findByStatus(status, pageable);
        } else if (targetType != null) {
            reports = reportRepository.findByTargetType(targetType, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }
        return reports.map(this::mapToResponse);
    }

    public ReportResponse getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return mapToResponse(report);
    }

    @Transactional
    public ReportResponse updateReportStatus(Long id, ReportStatus newStatus) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        
        report.setStatus(newStatus);
        Report updatedReport = reportRepository.save(report);

        if (newStatus == ReportStatus.RESOLVED) {
            handleResolvedTarget(updatedReport);
        }

        return mapToResponse(updatedReport);
    }

    private void handleResolvedTarget(Report report) {
        Long adminId = Long.valueOf(SecurityContextHolder.getContext().getAuthentication().getName());
        User adminUser = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        try {
            switch (report.getTargetType()) {
                case POLL -> pollService.deletePoll(report.getTargetId(), adminUser);
                case COMMENT -> commentService.deleteComment(report.getTargetId(), adminId, true);
                case USER -> {
                    // Yêu cầu: Không khóa tài khoản, chỉ ghi log hoặc xử lý cảnh cáo sau này nếu cần
                    log.info("Báo cáo về User được đánh giá là vi phạm, nhưng hệ thống không tự động khóa tài khoản.");
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi xóa đối tượng vi phạm (có thể đã bị xóa trước đó): {}", e.getMessage());
        }
    }

    private void validateTarget(ReportRequest request, Long reporterId) {
        switch (request.getTargetType()) {
            case POLL -> {
                Poll poll = pollRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
                if (poll.getCreator() != null && reporterId.equals(poll.getCreator().getId())) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
            }
            case COMMENT -> {
                Comment comment = commentRepository.findById(request.getTargetId())
                        .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
                if (comment.getUser() != null && reporterId.equals(comment.getUser().getId())) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
            }
            case USER -> {
                if (reporterId.equals(request.getTargetId())) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
                if (!userRepository.existsById(request.getTargetId())) {
                    throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
                }
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private ReportResponse mapToResponse(Report report) {
        String snippet = null;
        try {
            switch (report.getTargetType()) {
                case POLL -> snippet = pollRepository.findById(report.getTargetId()).map(p -> {
                    StringBuilder sb = new StringBuilder();
                    sb.append("TITLE:\n").append(p.getTitle());
                    if (p.getDescription() != null && !p.getDescription().isBlank()) {
                        sb.append("\n\nDESCRIPTION:\n").append(p.getDescription());
                    }
                    if (p.getOptions() != null && !p.getOptions().isEmpty()) {
                        sb.append("\n\nOPTIONS:\n");
                        int count = 0;
                        for (com.xxxx.systemvotting.modules.poll.entity.Option opt : p.getOptions()) {
                            sb.append("- ").append(opt.getText());
                            if (count < p.getOptions().size() - 1) sb.append("\n");
                            count++;
                        }
                    }
                    return sb.toString();
                }).orElse("[Poll has been deleted]");
                case COMMENT -> snippet = commentRepository.findById(report.getTargetId()).map(Comment::getContent).orElse("[Comment has been deleted]");
                case USER -> snippet = userRepository.findById(report.getTargetId()).map(User::getUsername).orElse("[User has been deleted]");
            }
        } catch (Exception e) {
            log.warn("Không thể lấy snippet cho báo cáo {}", report.getId());
        }

        return ReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporter().getId())
                .reporterName(report.getReporter().getUsername())
                .reporterEmail(report.getReporter().getEmail())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .targetSnippet(snippet)
                .reasonType(report.getReasonType())
                .description(report.getDescription())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
