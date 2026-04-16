package com.xxxx.systemvotting.common.dto;

public record TokenDetails(
        String value,
        String jwtId,
        long ttlSeconds
) {
}
