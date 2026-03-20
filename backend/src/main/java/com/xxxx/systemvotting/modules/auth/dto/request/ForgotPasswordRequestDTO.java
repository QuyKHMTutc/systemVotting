package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequestDTO(
    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    String email
) {}
