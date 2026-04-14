package com.xxxx.systemvotting.modules.auth.dto.response;

import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Builder
public record AuthResponseDTO(
    String accessToken,
    @JsonIgnore
    String refreshToken
) {}
