package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequestDTO(
    @NotBlank(message = "Google ID Token is required")
    String idToken
) {}
