package com.xxxx.systemvotting.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Cấu trúc phản hồi chuẩn của API")
public class ApiResponse<T> {
    @Schema(description = "Mã trạng thái HTTP (để tiện theo dõi trong data)", example = "200")
    private int status;

    @Schema(description = "Thông báo phản hồi", example = "Thao tác thành công")
    private String message;

    @Schema(description = "Dữ liệu trả về (có thể là object, list hoặc null)")
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .status(200)
                .message("Success")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
                .status(status)
                .message(message)
                .data(null)
                .build();
    }
}
