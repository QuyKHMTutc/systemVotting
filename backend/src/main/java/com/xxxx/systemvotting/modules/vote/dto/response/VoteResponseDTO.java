package com.xxxx.systemvotting.modules.vote.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "Thông tin chi tiết về lượt bỏ phiếu đã thực hiện")
public record VoteResponseDTO(
    @Schema(description = "ID của lượt bỏ phiếu", example = "1")
    Long id,

    @Schema(description = "ID của người dùng đã bỏ phiếu", example = "1")
    Long userId,

    @Schema(description = "ID của cuộc bình chọn", example = "1")
    Long pollId,

    @Schema(description = "ID của lựa chọn được chọn", example = "1")
    Long optionId,

    @Schema(description = "Thời gian thực hiện bỏ phiếu", example = "2024-03-20T10:00:00")
    LocalDateTime createdAt
) {}
