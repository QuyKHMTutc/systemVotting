package com.xxxx.systemvotting.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import static com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL;


@Builder
@JsonInclude(NON_NULL)
public record ErrorResponse(
        int code,
        int status,
        String message,
        String error,
        long timestamp,
        String path
) {
}
