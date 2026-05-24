package com.xxxx.systemvotting.modules.admin.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.common.enums.ModerationStatus;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.repository.CommentLikeRepository;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.notification.service.AsyncNotificationService;
import com.xxxx.systemvotting.modules.poll.enums.PollVisibility;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin Moderation Controller — Quản lý kiểm duyệt nội dung từ Admin Dashboard.
 *
 * Tất cả endpoint đều yêu cầu role ADMIN.
 */
@Tag(name = "Admin Moderation", description = "Quản lý kiểm duyệt nội dung cho Admin")
@RestController
@RequestMapping("/api/v1/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminModerationController {

    private final PollRepository pollRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PollMapper pollMapper;
    private final AsyncNotificationService asyncNotificationService;
    private final RealTimeService realTimeService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.xxxx.systemvotting.modules.user.repository.UserRepository userRepository;
    private final com.xxxx.systemvotting.modules.comment.cache.CommentCacheInvalidator commentCacheInvalidator;

    // ── Polls Moderation ─────────────────────────────────────────────────────

    @Operation(summary = "Danh sách bài đăng chờ duyệt",
               description = "Lấy tất cả poll có trạng thái SUSPICIOUS (đang chờ Admin duyệt)",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/polls/pending")
    public ApiResponse<PageResponse<PollResponseDTO>> getPendingPolls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Poll> suspiciousPolls = pollRepository.findSuspiciousPolls(pageable);

        Page<PollResponseDTO> dtoPage = suspiciousPolls.map(poll -> {
            PollResponseDTO dto = pollMapper.toDto(poll);
            dto.setModerationStatus(poll.getModerationStatus() != null ? poll.getModerationStatus().name() : null);
            dto.setModerationReason(poll.getModerationReason());
            return dto;
        });

        return ApiResponse.<PageResponse<PollResponseDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(PageResponse.from(dtoPage))
                .build();
    }

    @Operation(summary = "Số lượng mục cần kiểm duyệt",
               description = "Trả về tổng số poll SUSPICIOUS + comment SUSPICIOUS",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/count")
    public ApiResponse<Map<String, Long>> getModerationCount() {
        long pendingPolls = pollRepository.countSuspiciousPolls();
        long flaggedComments = commentRepository.countSuspiciousComments();
        Map<String, Long> counts = new HashMap<>();
        counts.put("pendingPolls", pendingPolls);
        counts.put("flaggedComments", flaggedComments);
        counts.put("total", pendingPolls + flaggedComments);
        return ApiResponse.<Map<String, Long>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(counts)
                .build();
    }

    @Operation(summary = "Phê duyệt bài đăng",
               description = "Đặt poll về trạng thái SAFE, kích hoạt thông báo và realtime broadcast",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @PostMapping("/polls/{id}/approve")
    public ApiResponse<PollResponseDTO> approvePoll(@PathVariable Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        poll.setModerationStatus(ModerationStatus.SAFE);
        poll.setModerationReason("Đã được Admin phê duyệt");
        pollRepository.save(poll);

        PollResponseDTO dto = pollMapper.toDto(poll);

        // Kích hoạt broadcast realtime sau khi duyệt
        if (poll.getVisibility() == PollVisibility.PUBLIC) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CREATED");
            payload.put("poll", dto);
            realTimeService.broadcast("/topic/polls/events", payload);
        } else if (poll.getVisibility() == PollVisibility.PRIVATE
                && poll.getInvitedEmails() != null
                && !poll.getInvitedEmails().isEmpty()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CREATED");
            payload.put("poll", dto);
            userRepository.findByEmailIn(poll.getInvitedEmails()).forEach(u ->
                messagingTemplate.convertAndSendToUser(u.getId().toString(), "/queue/polls/events", payload)
            );
        }

        // ── Real-time: thông báo creator poll đã được duyệt ──────────────────
        Long creatorId = poll.getCreator().getId();
        Map<String, Object> moderationEvent = new HashMap<>();
        moderationEvent.put("type", "POLL_APPROVED");
        moderationEvent.put("pollId", poll.getId());
        moderationEvent.put("title", poll.getTitle());
        messagingTemplate.convertAndSendToUser(
                creatorId.toString(),
                "/queue/moderation",
                moderationEvent
        );
        log.info("[Moderation WS] Sent POLL_APPROVED to creator userId={}, pollId={}", creatorId, poll.getId());

        // ── Real-time: cập nhật badge count cho AdminPanel ───────────────────
        broadcastAdminModerationCount();

        // Gửi thông báo mời giám khảo nếu có
        if (poll.getMembers() != null) {
            poll.getMembers().forEach(member -> {
                if (member.getRole() == com.xxxx.systemvotting.modules.poll.enums.PollRole.JUDGE) {
                    asyncNotificationService.createNotificationAsync(
                            member.getUser().getId(),
                            poll.getCreator().getUsername(),
                            poll.getCreator().getAvatarUrl(),
                            "JUDGE_INVITATION",
                            String.format("đã mời bạn làm Giám khảo cho cuộc bình chọn: %s", poll.getTitle()),
                            poll.getId(),
                            null
                    );
                }
            });
        }

        log.info("[Moderation] Admin đã PHÊ DUYỆT poll #{}: {}", poll.getId(), poll.getTitle());
        return ApiResponse.<PollResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Poll đã được phê duyệt và xuất hiện công khai")
                .data(dto)
                .build();
    }

    @Operation(summary = "Từ chối / Chặn bài đăng",
               description = "Đặt poll về trạng thái DANGEROUS — ẩn vĩnh viễn khỏi hệ thống",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @PostMapping("/polls/{id}/reject")
    public ApiResponse<Void> rejectPoll(@PathVariable Long id,
                                         @RequestBody(required = false) Map<String, String> body) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        String reason = body != null ? body.getOrDefault("reason", "Vi phạm tiêu chuẩn cộng đồng") : "Vi phạm tiêu chuẩn cộng đồng";
        poll.setModerationStatus(ModerationStatus.DANGEROUS);
        poll.setModerationReason("Admin từ chối: " + reason);
        pollRepository.save(poll);

        // ── Real-time: thông báo creator poll bị từ chối ─────────────────────
        Long creatorId = poll.getCreator().getId();
        Map<String, Object> moderationEvent = new HashMap<>();
        moderationEvent.put("type", "POLL_REJECTED");
        moderationEvent.put("pollId", poll.getId());
        moderationEvent.put("title", poll.getTitle());
        moderationEvent.put("reason", reason);
        messagingTemplate.convertAndSendToUser(
                creatorId.toString(),
                "/queue/moderation",
                moderationEvent
        );
        log.info("[Moderation WS] Sent POLL_REJECTED to creator userId={}, pollId={}", creatorId, poll.getId());

        // ── Real-time: xóa poll khỏi màn hình những người đang xem (public) ──
        if (poll.getVisibility() == PollVisibility.PUBLIC) {
            Map<String, Object> deleteEvent = new HashMap<>();
            deleteEvent.put("type", "DELETED");
            deleteEvent.put("pollId", poll.getId());
            realTimeService.broadcast("/topic/polls/events", deleteEvent);
        }

        // ── Real-time: cập nhật badge count cho AdminPanel ───────────────────
        broadcastAdminModerationCount();

        log.info("[Moderation] Admin đã TỪ CHỐI poll #{}: {}", poll.getId(), poll.getTitle());
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Poll đã bị từ chối")
                .build();
    }

    // ── Comments Moderation ──────────────────────────────────────────────────

    @Operation(summary = "Danh sách bình luận bị gắn cờ",
               description = "Lấy tất cả comment có trạng thái SUSPICIOUS",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/comments/flagged")
    public ApiResponse<PageResponse<FlaggedCommentDTO>> getFlaggedComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> flaggedComments = commentRepository.findSuspiciousComments(pageable);

        Page<FlaggedCommentDTO> dtoPage = flaggedComments.map(c -> new FlaggedCommentDTO(
                c.getId(),
                c.getContent(),
                c.getUser() != null ? c.getUser().getUsername() : "Ẩn danh",
                c.getUser() != null ? c.getUser().getAvatarUrl() : null,
                c.getPoll() != null ? c.getPoll().getId() : null,
                c.getPoll() != null ? c.getPoll().getTitle() : null,
                c.getModerationReason(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        ));

        return ApiResponse.<PageResponse<FlaggedCommentDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(PageResponse.from(dtoPage))
                .build();
    }

    @Operation(summary = "Cho phép bình luận nghi ngờ",
               description = "Đặt comment về trạng thái SAFE — bình luận đã được Admin xác nhận an toàn",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @PostMapping("/comments/{id}/approve")
    public ApiResponse<Void> approveComment(@PathVariable Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        comment.setModerationStatus(ModerationStatus.SAFE);
        comment.setModerationReason("Đã được Admin xác nhận an toàn");
        commentRepository.save(comment);

        // Evict cache so approved comment shows immediately without waiting for TTL
        if (comment.getPoll() != null) {
            commentCacheInvalidator.evictAllPagesForPoll(comment.getPoll().getId());
        }

        // ── Real-time: thông báo owner comment được duyệt ────────────────────
        if (comment.getUser() != null) {
            Long userId = comment.getUser().getId();
            Map<String, Object> moderationEvent = new HashMap<>();
            moderationEvent.put("type", "COMMENT_APPROVED");
            moderationEvent.put("commentId", comment.getId());
            moderationEvent.put("pollId", comment.getPoll() != null ? comment.getPoll().getId() : null);
            moderationEvent.put("content", comment.getContent().length() > 80
                    ? comment.getContent().substring(0, 80) + "..." : comment.getContent());
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/moderation",
                    moderationEvent
            );
        }

        // ── Real-time: cập nhật badge count cho AdminPanel ───────────────────
        broadcastAdminModerationCount();

        log.info("[Moderation] Admin đã XÁC NHẬN AN TOÀN comment #{}", id);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Bình luận đã được xác nhận an toàn")
                .build();
    }

    @Operation(summary = "Chặn / Ẩn bình luận nghi ngờ",
               description = "Đặt comment về trạng thái DANGEROUS — bình luận bị ẩn hoàn toàn",
               security = @SecurityRequirement(name = "Bearer Authentication"))
    @PostMapping("/comments/{id}/block")
    public ApiResponse<Void> blockComment(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        String reason = body != null ? body.getOrDefault("reason", "Vi phạm tiêu chuẩn cộng đồng") : "Vi phạm tiêu chuẩn cộng đồng";
        comment.setModerationStatus(ModerationStatus.DANGEROUS);
        comment.setModerationReason("Admin chặn: " + reason);
        commentRepository.save(comment);

        // Evict cache so blocked comment disappears immediately without waiting for 3-minute TTL
        if (comment.getPoll() != null) {
            commentCacheInvalidator.evictAllPagesForPoll(comment.getPoll().getId());
        }

        // ── Real-time: thông báo owner comment bị chặn ───────────────────────
        if (comment.getUser() != null) {
            Long userId = comment.getUser().getId();
            Map<String, Object> moderationEvent = new HashMap<>();
            moderationEvent.put("type", "COMMENT_BLOCKED");
            moderationEvent.put("commentId", comment.getId());
            moderationEvent.put("pollId", comment.getPoll() != null ? comment.getPoll().getId() : null);
            moderationEvent.put("reason", reason);
            moderationEvent.put("content", comment.getContent().length() > 80
                    ? comment.getContent().substring(0, 80) + "..." : comment.getContent());
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/moderation",
                    moderationEvent
            );
        }

        // ── Real-time: xóa comment khỏi màn hình những người đang xem poll ───
        if (comment.getPoll() != null) {
            long freshCommentCount = commentRepository.countVisibleByPollId(comment.getPoll().getId());
            Map<String, Object> deleteEvent = new HashMap<>();
            deleteEvent.put("type", "COMMENT_DELETED");
            deleteEvent.put("pollId", comment.getPoll().getId());
            deleteEvent.put("commentId", comment.getId());
            deleteEvent.put("commentCount", freshCommentCount);
            realTimeService.broadcast("/topic/polls/events", deleteEvent);
        }

        // ── Real-time: cập nhật badge count cho AdminPanel ───────────────────
        broadcastAdminModerationCount();

        log.info("[Moderation] Admin đã CHẶN comment #{}", id);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Bình luận đã bị chặn")
                .build();
    }

    // ── Helper: broadcast updated moderation count to all admin sessions ─────

    private void broadcastAdminModerationCount() {
        long pendingPolls = pollRepository.countSuspiciousPolls();
        long flaggedComments = commentRepository.countSuspiciousComments();
        Map<String, Object> countPayload = new HashMap<>();
        countPayload.put("type", "COUNT_UPDATED");
        countPayload.put("pendingPolls", pendingPolls);
        countPayload.put("flaggedComments", flaggedComments);
        countPayload.put("total", pendingPolls + flaggedComments);
        realTimeService.broadcast("/topic/admin/moderation", countPayload);
    }

    // ── DTO nội bộ ───────────────────────────────────────────────────────────

    public record FlaggedCommentDTO(
            Long id,
            String content,
            String username,
            String avatarUrl,
            Long pollId,
            String pollTitle,
            String moderationReason,
            String createdAt
    ) {}
}
