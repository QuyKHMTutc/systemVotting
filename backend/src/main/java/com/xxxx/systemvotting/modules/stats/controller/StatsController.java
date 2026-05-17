package com.xxxx.systemvotting.modules.stats.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.payment.repository.PaymentTransactionRepository;
import com.xxxx.systemvotting.modules.payment.enums.TransactionStatus;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Tag(name = "Stats", description = "Community statistics")
public class StatsController {

    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Operation(summary = "Community stats", description = "Returns aggregate community statistics")
    @GetMapping("/community")
    public ApiResponse<Map<String, Long>> getCommunityStats() {
        LocalDateTime now = LocalDateTime.now();

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalPolls",    pollRepository.count());
        stats.put("totalVotes",    voteRepository.count());
        stats.put("totalComments", commentRepository.count());
        stats.put("activePolls",   pollRepository.countPublicActivePolls(now));
        stats.put("totalUsers",    userRepository.count());
        stats.put("totalRevenue",  paymentTransactionRepository.sumAmountByStatus(TransactionStatus.SUCCESS));

        return ApiResponse.<Map<String, Long>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(stats)
                .build();
    }
}
