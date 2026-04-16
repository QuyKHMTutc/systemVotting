package com.xxxx.systemvotting.modules.vote.service;

import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;

import com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO;

public interface VoteService {
    VoteResponseDTO submitVote(VoteRequestDTO requestDTO);
    
    VoteCheckResponseDTO checkVote(Long userId, Long pollId);
}
