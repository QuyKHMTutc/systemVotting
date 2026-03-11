package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequestDTO {
    @NotBlank(message = "Google ID Token is required")
    private String idToken;
}
