package com.xxxx.systemvotting.modules.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Thông tin đăng nhập")
public class AuthRequestDTO {
    @Schema(description = "Địa chỉ email của người dùng", example = "user@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    @Schema(description = "Mật khẩu người dùng", example = "password123")
    @NotBlank(message = "Password is required")
    private String password;
}
