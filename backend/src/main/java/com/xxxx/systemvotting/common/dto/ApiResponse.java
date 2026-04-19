package com.xxxx.systemvotting.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

/**
 * Standard API response envelope.
 *
 * Using a record + @Builder via a custom static factory keeps the builder pattern
 * while gaining immutability. The generic T allows type-safe data payloads.
 */
@Builder
@Schema(description = "Cấu trúc phản hồi chuẩn của API")
public record ApiResponse<T>(

    @Schema(description = "Mã trạng thái HTTP", example = "200")
    int code,

    @Schema(description = "Thông báo phản hồi", example = "Thao tác thành công")
    String message,

    T data

) {}
