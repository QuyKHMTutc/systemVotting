package com.xxxx.systemvotting.common.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.common.service.imp.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * API upload ảnh độc lập — cho phép frontend upload ảnh trước khi tạo Poll.
 * Quy trình 2 bước:
 *   1. Frontend upload ảnh → nhận URL từ endpoint này.
 *   2. Frontend gửi thông tin Poll kèm imageUrl vừa nhận.
 */
@Tag(name = "Files", description = "Upload ảnh lên Cloudinary")
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final CloudinaryService cloudinaryService;

    @Operation(
        summary = "Upload ảnh lên Cloudinary",
        description = "Upload ảnh cho Poll cover image. Trả về URL Cloudinary HTTPS. Max 5MB, hỗ trợ JPG/PNG/GIF/WebP.",
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ApiResponse<Map<String, String>> uploadPollImage(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt.getSubject();
            String imageUrl = cloudinaryService.uploadPollImage(file, "user" + userId);
            log.info("[FileController] User {} uploaded poll image: {}", userId, imageUrl);
            return ApiResponse.<Map<String, String>>builder()
                    .code(HttpStatus.OK.value())
                    .message("Upload thành công")
                    .data(Map.of("url", imageUrl))
                    .build();
        } catch (IllegalArgumentException e) {
            return ApiResponse.<Map<String, String>>builder()
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message(e.getMessage())
                    .build();
        } catch (IOException e) {
            log.error("[FileController] Lỗi upload ảnh: {}", e.getMessage());
            return ApiResponse.<Map<String, String>>builder()
                    .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Không thể upload ảnh, vui lòng thử lại.")
                    .build();
        }
    }
}
