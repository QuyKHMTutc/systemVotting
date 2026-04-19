package com.xxxx.systemvotting.modules.user.dto;

import com.xxxx.systemvotting.modules.user.enums.PlanType;
import com.xxxx.systemvotting.modules.user.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;

@Schema(description = "Thông tin phản hồi của User")
public record UserResponseDTO(

    @Schema(description = "ID của người dùng", example = "1")
    Long id,

    @Schema(description = "Tên hiển thị", example = "tranquy")
    String username,

    @Schema(description = "Địa chỉ email", example = "user@gmail.com")
    String email,

    @Schema(description = "Đường dẫn ảnh đại diện", example = "https://example.com/avatars/1.jpg")
    String avatarUrl,

    @Schema(description = "Thời gian tạo tài khoản", example = "2024-03-10T15:00:00")
    LocalDateTime createdAt,

    @Schema(description = "Thời gian cập nhật", example = "2024-03-10T15:00:00")
    LocalDateTime updatedAt,

    @Schema(description = "Trạng thái khóa tài khoản", example = "false")
    boolean locked,

    @Schema(description = "Vai trò", example = "USER")
    String role,

    @Schema(description = "Gói hội viên", example = "FREE")
    String plan,

    @Schema(description = "Ngày hết hạn gói (null nếu FREE hoặc chưa có)", example = "2026-04-17T10:15:30")
    LocalDateTime planExpirationDate

) implements Serializable {}
