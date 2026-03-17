package com.xxxx.systemvotting.modules.comment.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Comments", description = "Bình luận theo bình chọn")
@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "Tạo bình luận", description = "Thêm bình luận cho một bình chọn (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponseDTO>> createComment(
            @Valid @RequestBody CommentRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        CommentResponseDTO response = commentService.createComment(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment created successfully", response));
    }

    @Operation(summary = "Bình luận theo poll", description = "Lấy danh sách bình luận của một bình chọn theo pollId")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công") })
    @GetMapping("/poll/{pollId}")
    public ResponseEntity<ApiResponse<List<CommentResponseDTO>>> getCommentsByPollId(@PathVariable Long pollId) {
        List<CommentResponseDTO> response = commentService.getCommentsByPollId(pollId);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully", response));
    }
}
