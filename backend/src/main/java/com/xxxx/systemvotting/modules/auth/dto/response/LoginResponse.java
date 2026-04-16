package com.xxxx.systemvotting.modules.auth.dto.response;

import lombok.Builder;
import java.util.Set;

@Builder
public record LoginResponse(String accessToken, String refreshToken, Set<String> roles) {}
