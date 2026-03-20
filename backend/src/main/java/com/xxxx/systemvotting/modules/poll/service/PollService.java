package com.xxxx.systemvotting.modules.poll.service;

import java.util.List;

import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.security.CustomUserDetails;
import org.springframework.data.domain.Page;

public interface PollService {
    PollResponseDTO createPoll(PollCreateRequestDTO requestDTO);

    PollResponseDTO getPollById(Long id);

    com.xxxx.systemvotting.common.dto.PageResponse<PollResponseDTO> getAllPolls(String title, String tag, String status, int page, int size, String sortBy, String direction);

    void deletePoll(Long pollId, CustomUserDetails authenticatedUser);

    List<PollResponseDTO> getMyPolls(Long userId);

    List<PollResponseDTO> getVotedPolls(Long userId);
}
