package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thông tin user được tìm thấy khi import danh sách giám khảo")
public record JudgeCandidateDTO(
    @Schema(description = "User ID", example = "1")
    Long id,

    @Schema(description = "Username", example = "john_doe")
    String username,

    @Schema(description = "Email", example = "john@example.com")
    String email,

    @Schema(description = "Avatar URL")
    String avatarUrl,

    @Schema(description = "Giá trị gốc từ file CSV dùng để tìm user", example = "john_doe")
    String matchedValue,

    @Schema(description = "Trạng thái tìm thấy hay không", example = "true")
    boolean found
) {}
