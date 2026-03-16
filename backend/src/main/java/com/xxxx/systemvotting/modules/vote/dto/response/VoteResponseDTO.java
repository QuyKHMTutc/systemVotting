package com.xxxx.systemvotting.modules.vote.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Thông tin chi tiết về lượt bỏ phiếu đã thực hiện")
public class VoteResponseDTO {
    @Schema(description = "ID của lượt bỏ phiếu", example = "1")
    private Long id;

    @Schema(description = "ID của người dùng đã bỏ phiếu", example = "1")
    private Long userId;

    @Schema(description = "ID của cuộc bình chọn", example = "1")
    private Long pollId;

    @Schema(description = "ID của lựa chọn được chọn", example = "1")
    private Long optionId;

    @Schema(description = "Thời gian thực hiện bỏ phiếu", example = "2024-03-20T10:00:00")
    private LocalDateTime createdAt;
}
