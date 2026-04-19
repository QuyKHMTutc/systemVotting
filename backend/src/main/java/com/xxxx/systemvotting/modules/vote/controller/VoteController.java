package com.xxxx.systemvotting.modules.vote.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for vote operations.
 *
 * Security contract:
 *   userId is ALWAYS extracted from the JWT token by this controller —
 *   never trusted from the request body. This prevents IDOR attacks where
 *   a malicious user could vote on behalf of another user by spoofing userId.
 */
@Tag(name = "Votes", description = "Bỏ phiếu và kiểm tra đã vote")
@RestController
@RequestMapping("/api/v1/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @Operation(
        summary = "Bỏ phiếu",
        description = "Gửi phiếu bầu cho một lựa chọn trong bình chọn (yêu cầu đăng nhập)",
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Bỏ phiếu thành công"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Đã vote rồi hoặc dữ liệu không hợp lệ"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    })
    @PostMapping
    public ApiResponse<VoteResponseDTO> submitVote(
            @Valid @RequestBody VoteRequestDTO requestDTO,
            @AuthenticationPrincipal Jwt jwt) {

        // Extract userId from JWT — never from the request body (IDOR prevention)
        Long userId = Long.valueOf(jwt.getSubject());

        VoteResponseDTO result = voteService.submitVote(userId, requestDTO.pollId(), requestDTO.optionId());

        return ApiResponse.<VoteResponseDTO>builder()
                .code(HttpStatus.CREATED.value())
                .message("Vote submitted successfully")
                .data(result)
                .build();
    }

    @Operation(
        summary = "Kiểm tra đã vote",
        description = "Kiểm tra user hiện tại đã bỏ phiếu cho poll chưa (yêu cầu đăng nhập)",
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập")
    })
    @GetMapping("/check")
    public ApiResponse<VoteCheckResponseDTO> checkVote(
            @RequestParam Long pollId,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        VoteCheckResponseDTO result = voteService.checkVote(userId, pollId);

        return ApiResponse.<VoteCheckResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Vote check retrieved successfully")
                .data(result)
                .build();
    }
}
