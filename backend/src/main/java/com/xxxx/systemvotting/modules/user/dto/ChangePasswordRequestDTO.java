package com.xxxx.systemvotting.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequestDTO(

    @NotBlank(message = "Old password is required")
    String oldPassword,

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
        message = "Mật khẩu phải có chữ hoa, chữ thường, chữ số và ký tự đặc biệt"
    )
    String newPassword

) {}
