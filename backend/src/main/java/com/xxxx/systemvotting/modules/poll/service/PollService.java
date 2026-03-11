package com.xxxx.systemvotting.modules.poll.service;

import java.util.List;

import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PollService {
    PollResponseDTO createPoll(PollCreateRequestDTO requestDTO);

    PollResponseDTO getPollById(Long id);

    Page<PollResponseDTO> getAllPolls(String title, String topic, String status, Pageable pageable);

    void deletePoll(Long pollId, User authenticatedUser);

    List<PollResponseDTO> getMyPolls(Long userId);

    List<PollResponseDTO> getVotedPolls(Long userId);
}
