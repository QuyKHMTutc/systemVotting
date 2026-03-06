package com.xxxx.systemvotting.modules.vote.controller;

import com.xxxx.systemvotting.common.ApiResponse;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

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
}
