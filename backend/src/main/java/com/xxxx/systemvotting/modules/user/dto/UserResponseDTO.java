package com.xxxx.systemvotting.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "Thông tin người dùng")
public class UserResponseDTO {
    @Schema(description = "ID của người dùng", example = "1")
    private Long id;

    @Schema(description = "Tên hiển thị", example = "tranquy")
    private String username;

    @Schema(description = "Địa chỉ email", example = "user@example.com")
    private String email;

    @Schema(description = "Đường dẫn ảnh đại diện", example = "https://example.com/avatars/1.jpg")
    private String avatarUrl;

    @Schema(description = "Thời gian tạo tài khoản", example = "2024-03-10T15:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật", example = "2024-03-10T15:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "Trạng thái khóa tài khoản", example = "false")
    private boolean locked;

    @Schema(description = "Vai trò", example = "USER")
    private String role;
}
