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

    /** Ki\u1ec3m tra quy\u1ec1n truy c\u1eadp: n\u1ebfu poll l\u00e0 PRIVATE, ch\u1ec9 creator ho\u1eb7c email \u0111\u01b0\u1ee3c m\u1eddi m\u1edbi \u0111\u01b0\u1ee3c ph\u00e9p. */
    PollResponseDTO getPollById(Long id, String callerEmail);

    PageResponse<PollResponseDTO> getAllPolls(String title, String tag, String status, String categorySlug, int page, int size, String sortBy, String direction);

    void deletePoll(Long pollId, User authenticatedUser);

    PageResponse<PollResponseDTO> getMyPolls(Long userId, int page, int size);

    PageResponse<PollResponseDTO> getVotedPolls(Long userId, int page, int size);

    List<PollResponseDTO> getTrendingPolls(int limit);

    List<JudgeCandidateDTO> parseJudgesFromCsv(String csvContent);

    List<JudgeCandidateDTO> searchUsers(String keyword);
}
