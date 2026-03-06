package com.xxxx.systemvotting.modules.poll.service;

import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PollService {
    PollResponseDTO createPoll(PollCreateRequestDTO requestDTO);

    PollResponseDTO getPollById(Long id);

    Page<PollResponseDTO> getAllPolls(Pageable pageable);

    void deletePoll(Long pollId, User authenticatedUser);
}
