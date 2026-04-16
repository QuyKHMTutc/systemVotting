package com.xxxx.systemvotting.modules.poll.dto;

import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

@Data
@Schema(description = "Thông tin phản hồi của bình chọn")
public class PollResponseDTO implements Serializable {
    @Schema(description = "ID của cuộc bình chọn", example = "1")
    private Long id;

    @Schema(description = "Tiêu đề của cuộc bình chọn", example = "Bạn thích ngôn ngữ lập trình nào nhất?")
    private String title;

    @Schema(description = "Mô tả chi tiết về cuộc bình chọn", example = "Cuộc khảo sát nhỏ về sở thích ngôn ngữ lập trình năm 2024")
    private String description;

    @Schema(description = "Danh sách các nhãn (tags)", example = "[\"IT\", \"Programming\"]")
    private List<String> tags;

    @Schema(description = "Chế độ ẩn danh", example = "false")
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @Schema(description = "Thời gian bắt đầu", example = "2024-03-20T10:00:00")
    private LocalDateTime startTime;

    @Schema(description = "Thời gian kết thúc", example = "2024-03-30T10:00:00")
    private LocalDateTime endTime;

    @Schema(description = "Thông tin người tạo")
    private UserResponseDTO creator;

    @Schema(description = "Danh sách các lựa chọn và kết quả vote")
    private List<OptionResponseDTO> options;

    @Schema(description = "Số lượng bình luận", example = "5")
    private int commentCount;

    @Schema(description = "Thời gian tạo", example = "2024-03-15T08:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật", example = "2024-03-15T09:00:00")
    private LocalDateTime updatedAt;
}
