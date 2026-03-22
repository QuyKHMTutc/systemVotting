package com.xxxx.systemvotting.modules.moderation.service.impl;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.moderation.dto.ModerationQueueResponseDTO;
import com.xxxx.systemvotting.modules.moderation.service.ModerationAdminService;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModerationAdminServiceImpl implements ModerationAdminService {

    private final CommentRepository commentRepository;
    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;
    private final PollMapper pollMapper;
    private final RealTimeService realTimeService;

    @Override
    @Transactional(readOnly = true)
    public ModerationQueueResponseDTO getReviewQueue() {
        List<CommentResponseDTO> comments = mapComments(commentRepository.findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.REVIEW));
        List<PollResponseDTO> polls = pollRepository.findByModerationStatusOrderByCreatedAtDesc(ModerationStatus.REVIEW)
                .stream()
                .map(this::mapPoll)
                .toList();
        return ModerationQueueResponseDTO.builder()
                .comments(comments)
                .polls(polls)
                .build();
    }

    @Override
    @Transactional
    public CommentResponseDTO reviewComment(Long commentId, ModerationStatus decision) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        comment.setModerationStatus(normalizeDecision(decision));
        Comment saved = commentRepository.save(comment);

        CommentResponseDTO dto = mapComments(List.of(saved)).getFirst();
        if (saved.getModerationStatus() == ModerationStatus.APPROVED) {
            realTimeService.broadcast("/topic/polls/" + saved.getPoll().getId() + "/comments", dto);
        }
        return dto;
    }

    @Override
    @Transactional
    public PollResponseDTO reviewPoll(Long pollId, ModerationStatus decision) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        poll.setModerationStatus(normalizeDecision(decision));
        Poll saved = pollRepository.save(poll);
        PollResponseDTO dto = mapPoll(saved);

        if (saved.getModerationStatus() == ModerationStatus.APPROVED) {
            realTimeService.broadcast("/topic/polls/events", java.util.Map.of(
                    "type", "CREATED",
                    "poll", dto
            ));
        }
        return dto;
    }

    private ModerationStatus normalizeDecision(ModerationStatus decision) {
        if (decision == null || decision == ModerationStatus.REVIEW) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return decision;
    }

    private PollResponseDTO mapPoll(Poll poll) {
        PollResponseDTO dto = pollMapper.toDto(poll);
        dto.setModerationStatus(poll.getModerationStatus() != null ? poll.getModerationStatus().name() : null);
        dto.setModerationLabel(poll.getModerationLabel());
        dto.setModerationConfidence(poll.getModerationConfidence());
        dto.setModerationField(poll.getModerationField());
        return dto;
    }

    private List<CommentResponseDTO> mapComments(List<Comment> comments) {
        if (comments.isEmpty()) return List.of();

        Long pollId = comments.getFirst().getPoll().getId();
        List<Vote> votes = voteRepository.findByPollId(pollId);
        Map<Long, String> userVoteMap = votes.stream().collect(Collectors.toMap(
                v -> v.getUser().getId(),
                v -> "Đã vote: " + v.getOption().getText(),
                (a, b) -> a
        ));

        Map<Long, String> anonymousDisplayNames = buildAnonymousDisplayNameMap(comments);
        return comments.stream().map(comment -> {
            String displayUsername = comment.isAnonymous()
                    ? anonymousDisplayNames.getOrDefault(comment.getUser().getId(), "Anonymous")
                    : comment.getUser().getUsername();
            String avatar = comment.isAnonymous() ? null : comment.getUser().getAvatarUrl();
            Long userId = comment.isAnonymous() ? null : comment.getUser().getId();
            String voteStatus = userVoteMap.getOrDefault(comment.getUser().getId(), "Chưa vote");

            return CommentResponseDTO.builder()
                    .id(comment.getId())
                    .userId(userId)
                    .username(displayUsername)
                    .avatarUrl(avatar)
                    .content(comment.getContent())
                    .isAnonymous(comment.isAnonymous())
                    .createdAt(comment.getCreatedAt())
                    .voteStatus(voteStatus)
                    .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                    .replies(List.of())
                    .moderationStatus(comment.getModerationStatus() != null ? comment.getModerationStatus().name() : null)
                    .moderationLabel(comment.getModerationLabel())
                    .moderationConfidence(comment.getModerationConfidence())
                    .build();
        }).toList();
    }

    private Map<Long, String> buildAnonymousDisplayNameMap(List<Comment> comments) {
        List<Comment> anonymousComments = comments.stream().filter(Comment::isAnonymous).toList();
        if (anonymousComments.isEmpty()) return Map.of();

        Map<Long, java.time.LocalDateTime> firstSeen = anonymousComments.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getUser().getId(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(Comment::getCreatedAt, Collectors.minBy(Comparator.naturalOrder())),
                                opt -> opt.orElseThrow()
                        )
                ));
        List<Long> orderedUserIds = firstSeen.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .toList();
        Map<Long, String> result = new LinkedHashMap<>();
        for (int i = 0; i < orderedUserIds.size(); i++) {
            result.put(orderedUserIds.get(i), "Anonymous " + (i + 1));
        }
        return result;
    }
}
