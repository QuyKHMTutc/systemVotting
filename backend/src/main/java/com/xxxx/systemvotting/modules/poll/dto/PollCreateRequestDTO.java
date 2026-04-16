package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Schema(description = "Yêu cầu tạo bình chọn mới")
public class PollCreateRequestDTO {
    @Schema(description = "Tiêu đề của cuộc bình chọn", example = "Bạn thích ngôn ngữ lập trình nào nhất?")
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @Schema(description = "Mô tả chi tiết về cuộc bình chọn", example = "Cuộc khảo sát nhỏ về sở thích ngôn ngữ lập trình năm 2024")
    private String description;

    @Schema(description = "Danh sách các nhãn (tags)", example = "[\"IT\", \"Programming\", \"2024\"]")
    private List<String> tags;

    @Schema(description = "Chế độ ẩn danh (người khác không thấy ai đã vote cho cái gì)", example = "false")
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @Schema(description = "Thời gian bắt đầu bình chọn (ISO-8601)", example = "2024-03-20T10:00:00")
    @FutureOrPresent(message = "Start time cannot be in the past")
    private LocalDateTime startTime;

    @Schema(description = "Thời gian kết thúc bình chọn (ISO-8601)", example = "2024-03-30T10:00:00")
    private LocalDateTime endTime;

    @Schema(description = "Danh sách các lựa chọn để bầu chọn")
    @NotNull(message = "Options are required")
    @Size(min = 2, message = "A poll must have at least 2 options")
    @Valid
    private List<OptionRequestDTO> options;

    @Schema(hidden = true)
    private Long creatorId; // Will be set by AuthenticationPrincipal
}
