package com.xxxx.systemvotting.common.dto;

import lombok.*;


@Builder
public record ErrorResponse(
        int code,
        int status,
        String message,
        String error,
        long timestamp,
        String path
) {
}
