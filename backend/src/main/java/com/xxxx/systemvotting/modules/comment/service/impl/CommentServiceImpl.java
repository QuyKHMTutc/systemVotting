package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.common.enums.ModerationStatus;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.common.util.ModerationDecisions;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentModerationService;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;
    private final RealTimeService realTimeService;
    private final UserRepository userRepository;
    private final CommentModerationService commentModerationService;

    @Override
    @org.springframework.transaction.annotation.Transactional
    @CacheEvict(value = "pollDetails", key = "#request.pollId")
    public CommentResponseDTO createComment(CommentRequestDTO request, Long userId) {
        Poll poll = pollRepository.findById(request.getPollId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        String normalizedContent = request.getContent().trim();
        CommentModerationService.ModerationResult moderationResult = commentModerationService.moderate(normalizedContent);
        if (moderationResult.available()) {
            log.info("Comment moderation result userId={} pollId={} label={} confidence={} blocked={}",
                    userId, poll.getId(), moderationResult.label(), moderationResult.confidence(), moderationResult.blocked());
        } else {
            log.warn("Comment moderation unavailable for userId={} pollId={}", userId, poll.getId());
        }

        ModerationStatus moderationStatus = ModerationDecisions.fromLabel(
                moderationResult.label(), moderationResult.blocked(), moderationResult.available());

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(normalizedContent)
                .isAnonymous(request.isAnonymous())
                .moderationStatus(moderationStatus)
                .moderationLabel(moderationResult.label())
                .moderationConfidence(moderationResult.confidence())
                .moderationReason(moderationResult.reason());

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            if (parent.getParent() != null) {
                commentBuilder.parent(parent.getParent());
            } else {
                commentBuilder.parent(parent);
            }
        }

        Comment comment = commentBuilder.build();
        comment = commentRepository.save(comment);

        String voteStatus = "Chưa vote";
        Optional<Vote> voteOpt = voteRepository.findByUserIdAndPollId(currentUser.getId(), poll.getId());
        if (voteOpt.isPresent()) {
            voteStatus = "Đã vote: " + voteOpt.get().getOption().getText();
        }

        Map<Long, String> anonymousDisplayNames = Map.of();
        if (comment.isAnonymous()) {
            List<Comment> anonymousComments = commentRepository
                    .findByPollIdAndModerationStatusOrderByCreatedAtDesc(poll.getId(), ModerationStatus.APPROVED)
                    .stream().filter(Comment::isAnonymous).toList();
            anonymousDisplayNames = buildAnonymousDisplayNameMap(anonymousComments);
        }

        CommentResponseDTO responseDTO = mapToDTO(comment, voteStatus, anonymousDisplayNames);

        if (comment.getModerationStatus() == ModerationStatus.APPROVED) {
            realTimeService.broadcast("/topic/polls/" + poll.getId() + "/comments", responseDTO);
        }

        return responseDTO;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByPollId(Long pollId) {
        List<Comment> comments = commentRepository.findByPollIdAndModerationStatusOrderByCreatedAtDesc(pollId, ModerationStatus.APPROVED);

        if (comments.isEmpty()) {
            return List.of();
        }

        List<Vote> votes = voteRepository.findByPollId(pollId);
        Map<Long, String> userVoteMap = votes.stream()
                .collect(Collectors.toMap(
                        v -> v.getUser().getId(),
                        v -> "Đã vote: " + v.getOption().getText(),
                        (existing, replacement) -> existing
                ));

        Map<Long, String> anonymousDisplayNames = buildAnonymousDisplayNameMap(comments);

        List<CommentResponseDTO> allCommentDTOs = comments.stream()
                .map(comment -> {
                    String voteStatus = userVoteMap.getOrDefault(comment.getUser().getId(), "Chưa vote");
                    return mapToDTO(comment, voteStatus, anonymousDisplayNames);
                })
                .collect(Collectors.toList());

        List<CommentResponseDTO> rootComments = allCommentDTOs.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());

        Map<Long, List<CommentResponseDTO>> repliesByParentId = allCommentDTOs.stream()
                .filter(c -> c.getParentId() != null)
                .sorted(Comparator.comparing(CommentResponseDTO::getCreatedAt))
                .collect(Collectors.groupingBy(CommentResponseDTO::getParentId));

        rootComments.forEach(root -> root.setReplies(repliesByParentId.getOrDefault(root.getId(), List.of())));
        return rootComments;
    }

    private Map<Long, String> buildAnonymousDisplayNameMap(List<Comment> comments) {
        List<Comment> anonymousComments = comments.stream()
                .filter(Comment::isAnonymous)
                .toList();

        if (anonymousComments.isEmpty()) {
            return Map.of();
        }

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

    private CommentResponseDTO mapToDTO(Comment comment, String voteStatus, Map<Long, String> anonymousDisplayNames) {
        String displayUsername;
        if (comment.isAnonymous()) {
            displayUsername = anonymousDisplayNames.getOrDefault(comment.getUser().getId(), "Anonymous");
        } else {
            displayUsername = comment.getUser().getUsername();
        }
        String displayAvatarUrl = comment.isAnonymous() ? null : comment.getUser().getAvatarUrl();
        Long userId = comment.isAnonymous() ? null : comment.getUser().getId();

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .userId(userId)
                .username(displayUsername)
                .avatarUrl(displayAvatarUrl)
                .content(comment.getContent())
                .isAnonymous(comment.isAnonymous())
                .createdAt(comment.getCreatedAt())
                .voteStatus(voteStatus)
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(java.util.List.of())
                .moderationStatus(comment.getModerationStatus() != null ? comment.getModerationStatus().name() : null)
                .moderationLabel(comment.getModerationLabel())
                .moderationConfidence(comment.getModerationConfidence())
                .build();
    }
}
