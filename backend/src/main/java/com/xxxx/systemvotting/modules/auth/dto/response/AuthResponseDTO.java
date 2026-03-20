package com.xxxx.systemvotting.modules.auth.dto.response;

import lombok.Builder;

@Builder
public record AuthResponseDTO(
    String accessToken,
    String refreshToken
) {}
