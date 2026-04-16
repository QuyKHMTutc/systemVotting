package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TokenRefreshRequestDTO(
    @NotBlank(message = "Refresh Token is required")
    String refreshToken
) {}
