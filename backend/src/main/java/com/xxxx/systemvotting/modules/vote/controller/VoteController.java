package com.xxxx.systemvotting.modules.vote.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Votes", description = "Bỏ phiếu và kiểm tra đã vote")
@RestController
@RequestMapping("/api/v1/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @Operation(summary = "Bỏ phiếu", description = "Gửi phiếu bầu cho một lựa chọn trong bình chọn (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Bỏ phiếu thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Đã vote rồi hoặc dữ liệu không hợp lệ"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PostMapping
    public ResponseEntity<ApiResponse<VoteResponseDTO>> submitVote(
            @Valid @RequestBody VoteRequestDTO requestDTO,
            @AuthenticationPrincipal User user) {

        // Security enhancement: enforce the vote belongs to the currently authenticated
        // user
        requestDTO.setUserId(user.getId());

        VoteResponseDTO voteResult = voteService.submitVote(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vote submitted successfully", voteResult));
    }

    @Operation(summary = "Kiểm tra đã vote", description = "Kiểm tra user hiện tại đã bỏ phiếu cho poll chưa (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @org.springframework.web.bind.annotation.GetMapping("/check")
    public ResponseEntity<ApiResponse<com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO>> checkVote(
            @org.springframework.web.bind.annotation.RequestParam Long pollId,
            @AuthenticationPrincipal User user) {
        com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO checkResult = voteService.checkVote(user.getId(), pollId);
        return ResponseEntity.ok(ApiResponse.success("Vote check retrieved successfully", checkResult));
    }
}
