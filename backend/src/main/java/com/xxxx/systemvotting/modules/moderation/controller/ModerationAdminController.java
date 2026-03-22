package com.xxxx.systemvotting.modules.moderation.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.moderation.dto.ModerationDecisionRequestDTO;
import com.xxxx.systemvotting.modules.moderation.dto.ModerationQueueResponseDTO;
import com.xxxx.systemvotting.modules.moderation.service.ModerationAdminService;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Moderation Admin", description = "Admin review queue for comments and polls")
@RestController
@RequestMapping("/api/v1/admin/moderation")
@RequiredArgsConstructor
public class ModerationAdminController {

    private final ModerationAdminService moderationAdminService;

    @Operation(summary = "Review queue", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping
    public ApiResponse<ModerationQueueResponseDTO> getReviewQueue() {
        return ApiResponse.<ModerationQueueResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(moderationAdminService.getReviewQueue())
                .build();
    }

    @Operation(summary = "Review comment", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @PutMapping("/comments/{commentId}")
    public ApiResponse<CommentResponseDTO> reviewComment(@PathVariable Long commentId,
                                                         @Valid @RequestBody ModerationDecisionRequestDTO request) {
        return ApiResponse.<CommentResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Comment reviewed successfully")
                .data(moderationAdminService.reviewComment(commentId, request.getDecision()))
                .build();
    }

    @Operation(summary = "Review poll", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @PutMapping("/polls/{pollId}")
    public ApiResponse<PollResponseDTO> reviewPoll(@PathVariable Long pollId,
                                                   @Valid @RequestBody ModerationDecisionRequestDTO request) {
        return ApiResponse.<PollResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Poll reviewed successfully")
                .data(moderationAdminService.reviewPoll(pollId, request.getDecision()))
                .build();
    }
}
