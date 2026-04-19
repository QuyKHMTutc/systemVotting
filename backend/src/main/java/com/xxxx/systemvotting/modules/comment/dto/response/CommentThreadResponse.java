package com.xxxx.systemvotting.modules.comment.dto.response;

import com.xxxx.systemvotting.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Paginated root comments for a poll plus total thread size (roots + replies) for UI counters.
 */
@Schema(description = "Danh sách bình luận gốc theo trang và tổng số bình luận trong poll")
public record CommentThreadResponse(
        @Schema(description = "Trang các comment gốc (replies nằm trong từng phần tử)")
        PageResponse<CommentResponseDTO> page,
        @Schema(description = "Tổng số comment trong poll (gồm cả reply)", example = "42")
        long totalAllComments
) {}
