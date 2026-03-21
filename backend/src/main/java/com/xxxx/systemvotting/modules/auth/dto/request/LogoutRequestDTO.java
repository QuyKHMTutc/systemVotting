package com.xxxx.systemvotting.modules.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class LogoutRequestDTO {
    @Schema(description = "Refresh token to be revoked alongside the access token")
    private String refreshToken;
}
