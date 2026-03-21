package com.xxxx.systemvotting.modules.auth.dto.response;

import lombok.Builder;

@Builder
public record TokenDetails(
        String value,
        String jwtId,
        long ttlSeconds
) {}
