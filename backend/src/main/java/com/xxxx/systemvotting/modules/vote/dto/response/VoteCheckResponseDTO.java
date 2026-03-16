package com.xxxx.systemvotting.modules.vote.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kết quả kiểm tra xem người dùng đã bình chọn hay chưa")
public class VoteCheckResponseDTO {
    @Schema(description = "Trạng thái đã bình chọn", example = "true")
    private boolean hasVoted;

    @Schema(description = "ID của lựa chọn đã chọn (null nếu chưa bình chọn)", example = "1")
    private Long optionId;
}
