package com.xxxx.systemvotting.modules.comment.service.impl;

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
import com.xxxx.systemvotting.common.service.RealTimeService;
import org.springframework.cache.annotation.CacheEvict;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        if (moderationResult.blocked()) {
            throw new AppException(ErrorCode.COMMENT_BLOCKED);
        }

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(normalizedContent)
                .isAnonymous(request.isAnonymous());

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            // Business rule: To prevent deep nesting, if the parent itself is a reply, we link to the root parent.
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

        // Optimization: For single comment creation, we don't need to build the map for ALL poll comments.
        // We just need the anonymous label for this specific user.
        Map<Long, String> anonymousDisplayNames = Map.of();
        if (comment.isAnonymous()) {
            List<Comment> anonymousComments = commentRepository.findByPollIdOrderByCreatedAtDesc(poll.getId())
                    .stream().filter(Comment::isAnonymous).toList();
            anonymousDisplayNames = buildAnonymousDisplayNameMap(anonymousComments);
        }

        CommentResponseDTO responseDTO = mapToDTO(comment, voteStatus, anonymousDisplayNames);

        // Broadcast the new comment to all connected clients watching this poll
        realTimeService.broadcast("/topic/polls/" + poll.getId() + "/comments", responseDTO);

        return responseDTO;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsByPollId(Long pollId) {
        List<Comment> comments = commentRepository.findByPollIdOrderByCreatedAtDesc(pollId);
        
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

        // Get all comments and map them to DTOs
        List<CommentResponseDTO> allCommentDTOs = comments.stream()
                .map(comment -> {
                    String voteStatus = userVoteMap.getOrDefault(comment.getUser().getId(), "Chưa vote");
                    return mapToDTO(comment, voteStatus, anonymousDisplayNames);
                })
                .collect(Collectors.toList());

        // Group into hierarchical structure (Parent -> Replies)
        List<CommentResponseDTO> rootComments = allCommentDTOs.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());

        Map<Long, List<CommentResponseDTO>> repliesByParentId = allCommentDTOs.stream()
                .filter(c -> c.getParentId() != null)
                .sorted(Comparator.comparing(CommentResponseDTO::getCreatedAt)) // Sort replies ascending
                .collect(Collectors.groupingBy(CommentResponseDTO::getParentId));

        rootComments.forEach(root -> {
            root.setReplies(repliesByParentId.getOrDefault(root.getId(), List.of()));
        });

        // We only return the root comments (because replies are nested inside them)
        return rootComments;
    }

    /**
     * Builds a stable map: userId -> "Anonymous 1", "Anonymous 2", etc. for anonymous commenters.
     * Same user on same poll gets the same label; different users get different numbers.
     */
    private Map<Long, String> buildAnonymousDisplayNameMap(List<Comment> comments) {
        List<Comment> anonymousComments = comments.stream()
                .filter(Comment::isAnonymous)
                .toList();

        if (anonymousComments.isEmpty()) {
            return Map.of();
        }

        // Order by first appearance: userId -> min(createdAt)
        Map<Long, java.time.LocalDateTime> firstSeen = anonymousComments.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getUser().getId(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(Comment::getCreatedAt, Collectors.minBy(Comparator.naturalOrder())),
                                opt -> opt.orElseThrow()
                        )
                ));

        // Sort userIds by first appearance time
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
            displayUsername = anonymousDisplayNames.getOrDefault(
                    comment.getUser().getId(), "Anonymous");
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
                .replies(java.util.List.of()) // Initialize empty mutable list for later modification if needed, or keeping it empty here since we will set it during tree building
                .build();
    }
}
