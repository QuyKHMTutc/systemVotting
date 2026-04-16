package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.common.service.imp.AiModerationService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;
    private final RealTimeService realTimeService;
    private final AiModerationService aiModerationService;
    private final NotificationService notificationService;

    @Override
    @org.springframework.transaction.annotation.Transactional
    @CacheEvict(value = "pollDetails", key = "#request.pollId")
    public CommentResponseDTO createComment(CommentRequestDTO request, Long userId) {
        Poll poll = pollRepository.findById(request.getPollId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        User currentUser = com.xxxx.systemvotting.modules.user.repository.UserRepository.class.cast(org.springframework.beans.factory.BeanFactory.class.cast(org.springframework.web.context.support.WebApplicationContextUtils.getRequiredWebApplicationContext(((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes()).getRequest().getServletContext())).getBean(com.xxxx.systemvotting.modules.user.repository.UserRepository.class)).findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        // Enforce Identity Consistency
        if (poll.getCreator().getId().equals(userId)) {
            if (poll.isAnonymous() != request.isAnonymous()) {
                throw new AppException(ErrorCode.IDENTITY_CONFLICT);
            }
        } else {
            java.util.Optional<Comment> prevCommentOpt = commentRepository.findFirstByUserIdAndPollIdOrderByCreatedAtAsc(userId, poll.getId());
            if (prevCommentOpt.isPresent()) {
                boolean previousAnonymous = prevCommentOpt.get().isAnonymous();
                if (previousAnonymous != request.isAnonymous()) {
                    throw new AppException(ErrorCode.IDENTITY_CONFLICT);
                }
            }
        }

        if (aiModerationService.isToxicContent(request.getContent())) {
            throw new AppException(ErrorCode.TOXIC_CONTENT);
        }

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(request.getContent())
                .isAnonymous(request.isAnonymous());

        Comment originalParent = null;

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            
            originalParent = parent;
            
            // Business rule: To prevent deep nesting, if the parent itself is a reply, we link to the root parent.
            if (parent.getParent() != null) {
                commentBuilder.parent(parent.getParent());
            } else {
                commentBuilder.parent(parent);
            }
        }

        Comment comment = commentBuilder.build();
        comment = commentRepository.save(comment);

        // ---------------- Notification Logic ----------------
        String actorName = comment.isAnonymous() ? null : currentUser.getUsername();
        String actorAvatar = comment.isAnonymous() ? null : currentUser.getAvatarUrl();
        String shortMessage = request.getContent().length() > 50 ? request.getContent().substring(0, 47) + "..." : request.getContent();

        if (originalParent != null) {
            // It's a reply. Notify the direct parent comment author (the person actually being replied to)
            User directTarget = originalParent.getUser();
            if (!directTarget.getId().equals(currentUser.getId())) {
                notificationService.createNotification(
                        directTarget.getId(),
                        actorName, 
                        actorAvatar, 
                        "NEW_REPLY", 
                        shortMessage, 
                        poll.getId(), 
                        comment.getId()
                );
            }
            
            // Optionally, if the originalParent is already a nested reply, its author is different from root parent.
            // We could also notify the root parent, but keeping it to direct target reduces spam like Facebook does.
        } else {
            // It's a top level comment. Notify the poll author (if it's not themselves)
            User pollCreator = poll.getCreator();
            if (!pollCreator.getId().equals(currentUser.getId())) {
                notificationService.createNotification(
                        pollCreator.getId(),
                        actorName,
                        actorAvatar,
                        "NEW_COMMENT",
                        shortMessage,
                        poll.getId(),
                        comment.getId()
                );
            }
        }
        // ----------------------------------------------------

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

        java.util.Map<String, Object> eventPayload = new java.util.HashMap<>();
        eventPayload.put("type", "COMMENT_ADDED");
        eventPayload.put("pollId", poll.getId());
        realTimeService.broadcast("/topic/polls/events", eventPayload);

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

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentResponseDTO> getMyComments(Long userId) {
        List<Comment> comments = commentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (comments.isEmpty()) return List.of();

        // Get all votes for this user across these polls
        List<Long> pollIds = comments.stream().map(c -> c.getPoll().getId()).distinct().toList();
        List<Vote> votes = voteRepository.findByUserIdAndPollIdIn(userId, pollIds);
        Map<Long, String> pollVoteMap = votes.stream()
                .collect(Collectors.toMap(
                        v -> v.getPoll().getId(),
                        v -> "Đã vote: " + v.getOption().getText(),
                        (existing, replacement) -> existing
                ));

        return comments.stream()
                .map(comment -> {
                    String voteStatus = pollVoteMap.getOrDefault(comment.getPoll().getId(), "Chưa vote");
                    return mapToDTO(comment, voteStatus, Map.of());
                })
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO getIdentityStatus(Long pollId, Long userId) {
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        
        // Creator identity is permanently locked to poll identity
        if (poll.getCreator().getId().equals(userId)) {
            return com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO.builder()
                    .hasCommented(true) // Threat it as locked
                    .isAnonymous(poll.isAnonymous())
                    .build();
        }

        java.util.Optional<Comment> prevComment = commentRepository.findFirstByUserIdAndPollIdOrderByCreatedAtAsc(userId, pollId);
        if (prevComment.isPresent()) {
            return com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO.builder()
                    .hasCommented(true)
                    .isAnonymous(prevComment.get().isAnonymous())
                    .build();
        }
        return com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO.builder()
                .hasCommented(false)
                .isAnonymous(null)
                .build();
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
                .pollId(comment.getPoll() != null ? comment.getPoll().getId() : null)
                .pollTitle(comment.getPoll() != null ? comment.getPoll().getTitle() : null)
                .replies(java.util.List.of()) // Initialize empty mutable list for later modification if needed, or keeping it empty here since we will set it during tree building
                .build();
    }
}
