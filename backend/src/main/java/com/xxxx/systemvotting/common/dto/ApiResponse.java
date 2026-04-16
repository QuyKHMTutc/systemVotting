package com.xxxx.systemvotting.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Cấu trúc phản hồi chuẩn của API")
public class ApiResponse<T> {
    @Schema(description = "Mã trạng thái HTTP (để tiện theo dõi trong data)", example = "200")
    private int code;

    @Schema(description = "Thông báo phản hồi", example = "Thao tác thành công")
    private String message;

    private T data;
}
