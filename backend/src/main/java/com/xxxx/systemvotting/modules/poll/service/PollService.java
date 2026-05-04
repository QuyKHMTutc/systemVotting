package com.xxxx.systemvotting.modules.poll.service;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.poll.dto.JudgeCandidateDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;

import java.util.List;

public interface PollService {
    PollResponseDTO createPoll(PollCreateRequestDTO requestDTO);

    PollResponseDTO getPollById(Long id);

    PageResponse<PollResponseDTO> getAllPolls(String title, String tag, String status, int page, int size, String sortBy, String direction);

    void deletePoll(Long pollId, User authenticatedUser);

    PageResponse<PollResponseDTO> getMyPolls(Long userId, int page, int size);

    PageResponse<PollResponseDTO> getVotedPolls(Long userId, int page, int size);

    List<JudgeCandidateDTO> parseJudgesFromCsv(String csvContent);

    List<JudgeCandidateDTO> searchUsers(String keyword);
}
