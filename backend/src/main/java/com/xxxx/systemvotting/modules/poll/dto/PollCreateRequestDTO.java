package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.xxxx.systemvotting.modules.poll.enums.PollVisibility;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Yêu cầu tạo bình chọn mới")
public record PollCreateRequestDTO(

    @Schema(description = "Tiêu đề của cuộc bình chọn", example = "Bạn thích ngôn ngữ lập trình nào nhất?")
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    String title,

    @Schema(description = "Mô tả chi tiết", example = "Cuộc khảo sát nhỏ về sở thích ngôn ngữ lập trình năm 2024")
    String description,

    @Schema(description = "Danh sách các nhãn (tags)", example = "[\"IT\", \"Programming\"]")
    List<String> tags,

    @Schema(description = "Chế độ ẩn danh", example = "false")
    @JsonProperty("isAnonymous")
    boolean isAnonymous,

    @Schema(description = "Thời gian bắt đầu (ISO-8601)", example = "2024-03-20T10:00:00")
    @FutureOrPresent(message = "Start time cannot be in the past")
    LocalDateTime startTime,

    @Schema(description = "Thời gian kết thúc (ISO-8601)", example = "2024-03-30T10:00:00")
    LocalDateTime endTime,

    @Schema(description = "Danh sách các lựa chọn để bầu chọn")
    @NotNull(message = "Options are required")
    @Size(min = 2, message = "A poll must have at least 2 options")
    @Valid
    List<OptionRequestDTO> options,

    @Schema(description = "Danh sách User ID làm giám khảo", example = "[1, 2, 3]")
    List<Long> judgeIds,

    @Schema(description = "Quyền riêng tư của cuộc bình chọn", example = "PUBLIC", allowableValues = {"PUBLIC", "PRIVATE"})
    PollVisibility visibility,

    @Schema(description = "Danh sách email được mời (chỉ dùng khi visibility = PRIVATE)", example = "[\"a@b.com\", \"c@d.com\"]")
    List<String> invitedEmails,

    /**
     * Injected by the controller from the JWT — never from the client request body.
     * Hidden from Swagger to avoid confusion.
     */
    @Schema(hidden = true)
    Long creatorId

) {}
