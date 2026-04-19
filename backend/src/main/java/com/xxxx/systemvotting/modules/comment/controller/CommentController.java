package com.xxxx.systemvotting.modules.comment.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentThreadResponse;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import io.swagger.v3.oas.annotations.Parameter;

@Tag(name = "Comments", description = "Bình luận theo bình chọn")
@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "Tạo bình luận", description = "Thêm bình luận cho một bình chọn (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PostMapping
    public ApiResponse<CommentResponseDTO> createComment(
            @Valid @RequestBody CommentRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        CommentResponseDTO response = commentService.createComment(request, Long.valueOf(jwt.getSubject()));
        return ApiResponse.<CommentResponseDTO>builder()
                .code(HttpStatus.CREATED.value())
                .message("Comment created successfully")
                .data(response)
                .build();
    }

    @Operation(summary = "Bình luận theo poll (phân trang)", description = "Lấy các comment gốc theo trang; replies nằm trong từng comment. totalAllComments = tổng thread.")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công") })
    @GetMapping("/poll/{pollId}")
    public ApiResponse<CommentThreadResponse> getCommentsByPollId(
            @PathVariable Long pollId,
            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Kích thước trang, tối đa 50") @RequestParam(defaultValue = "20") int size) {
        CommentThreadResponse response = commentService.getCommentsByPollId(pollId, page, size);
        return ApiResponse.<CommentThreadResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Comments retrieved successfully")
                .data(response)
                .build();
    }

    @Operation(summary = "Lấy bình luận của tôi", description = "Danh sách bình luận của người dùng hiện tại")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công") })
    @GetMapping("/me")
    public ApiResponse<List<CommentResponseDTO>> getMyComments(@AuthenticationPrincipal Jwt jwt) {
        List<CommentResponseDTO> response = commentService.getMyComments(Long.valueOf(jwt.getSubject()));
        return ApiResponse.<List<CommentResponseDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("My comments retrieved successfully")
                .data(response)
                .build();
    }

    @Operation(summary = "Kiểm tra danh tính bình luận", description = "Trả về trạng thái xem người dùng đã từng bình luận chưa và danh tính là gì")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công") })
    @GetMapping("/identity-status")
    public ApiResponse<com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO> getIdentityStatus(
            @RequestParam("pollId") Long pollId,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ApiResponse.<com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO>builder()
                    .code(HttpStatus.UNAUTHORIZED.value())
                    .message("Unauthorized")
                    .data(null)
                    .build();
        }
        com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO response = 
                commentService.getIdentityStatus(pollId, Long.valueOf(jwt.getSubject()));
        return ApiResponse.<com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Identity status retrieved")
                .data(response)
                .build();
    }
}
