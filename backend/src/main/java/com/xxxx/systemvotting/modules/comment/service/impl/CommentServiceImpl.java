package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.cache.CommentCacheInvalidator;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentThreadResponse;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.common.service.imp.AiModerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private static final int MAX_PAGE_SIZE = 50;

    private final CommentRepository commentRepository;
    private final PollRepository pollRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final RealTimeService realTimeService;
    private final AiModerationService aiModerationService;
    private final NotificationService notificationService;
    private final CommentCacheInvalidator commentCacheInvalidator;

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "pollDetails", key = "#request.pollId")
    })
    public CommentResponseDTO createComment(CommentRequestDTO request, Long userId) {
        Poll poll = pollRepository.findById(request.pollId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (poll.getCreator().getId().equals(userId)) {
            if (poll.isAnonymous() != request.isAnonymous()) {
                throw new AppException(ErrorCode.IDENTITY_CONFLICT);
            }
        } else {
            Optional<Comment> prevCommentOpt = commentRepository.findFirstByUserIdAndPollIdOrderByCreatedAtAsc(userId, poll.getId());
            if (prevCommentOpt.isPresent()) {
                boolean previousAnonymous = prevCommentOpt.get().isAnonymous();
                if (previousAnonymous != request.isAnonymous()) {
                    throw new AppException(ErrorCode.IDENTITY_CONFLICT);
                }
            }
        }

        if (aiModerationService.isToxicContent(request.content())) {
            throw new AppException(ErrorCode.TOXIC_CONTENT);
        }

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(request.content())
                .isAnonymous(request.isAnonymous());

        Comment originalParent = null;

        if (request.parentId() != null) {
            Comment parent = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

            if (!parent.getPoll().getId().equals(poll.getId())) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            originalParent = parent;

            if (parent.getParent() != null) {
                commentBuilder.parent(parent.getParent());
            } else {
                commentBuilder.parent(parent);
            }
        }

        Comment comment = commentBuilder.build();
        comment = commentRepository.save(comment);

        String actorName = comment.isAnonymous() ? null : currentUser.getUsername();
        String actorAvatar = comment.isAnonymous() ? null : currentUser.getAvatarUrl();
        String shortMessage = request.content().length() > 50 ? request.content().substring(0, 47) + "..." : request.content();

        if (originalParent != null) {
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
        } else {
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

        String voteStatus = "Chưa vote";
        Optional<Vote> voteOpt = voteRepository.findByUserIdAndPollId(currentUser.getId(), poll.getId());
        if (voteOpt.isPresent()) {
            voteStatus = "Đã vote: " + voteOpt.get().getOption().getText();
        }

        Map<Long, String> anonymousDisplayNames = comment.isAnonymous()
                ? buildGlobalAnonymousLabelMap(poll.getId())
                : Map.of();

        CommentResponseDTO responseDTO = mapToDTO(comment, voteStatus, anonymousDisplayNames);

        realTimeService.broadcast("/topic/polls/" + poll.getId() + "/comments", responseDTO);

        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("type", "COMMENT_ADDED");
        eventPayload.put("pollId", poll.getId());
        realTimeService.broadcast("/topic/polls/events", eventPayload);

        commentCacheInvalidator.evictAllPagesForPoll(poll.getId());

        return responseDTO;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "comments", key = "#pollId + ':' + #page + ':' + #size")
    public CommentThreadResponse getCommentsByPollId(Long pollId, int page, int size) {
        pollRepository.findById(pollId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        int safeSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(0, page);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        long totalAll = commentRepository.countByPollId(pollId);
        Page<Comment> rootPage = commentRepository.findRootCommentsByPollId(pollId, pageable);

        if (rootPage.isEmpty()) {
            Page<CommentResponseDTO> empty = new PageImpl<>(List.of(), pageable, rootPage.getTotalElements());
            return new CommentThreadResponse(PageResponse.from(empty), totalAll);
        }

        List<Long> rootIds = rootPage.getContent().stream().map(Comment::getId).toList();
        List<Comment> replies = commentRepository.findRepliesForRoots(pollId, rootIds);

        List<Comment> combined = new ArrayList<>(rootPage.getContent().size() + replies.size());
        combined.addAll(rootPage.getContent());
        combined.addAll(replies);

        Map<Long, String> userVoteMap = buildUserVoteLabelMap(pollId);
        Map<Long, String> anonymousLabels = buildGlobalAnonymousLabelMap(pollId);

        List<CommentResponseDTO> flat = combined.stream()
                .map(c -> mapToDTO(c, userVoteMap.getOrDefault(c.getUser().getId(), "Chưa vote"), anonymousLabels))
                .collect(Collectors.toList());

        Map<Long, CommentResponseDTO> byId = flat.stream()
                .collect(Collectors.toMap(CommentResponseDTO::getId, dto -> dto, (a, b) -> a));

        List<CommentResponseDTO> rootDtos = rootPage.getContent().stream()
                .map(c -> byId.get(c.getId()))
                .collect(Collectors.toList());

        Map<Long, List<CommentResponseDTO>> repliesByParent = flat.stream()
                .filter(c -> c.getParentId() != null)
                .sorted(Comparator.comparing(CommentResponseDTO::getCreatedAt))
                .collect(Collectors.groupingBy(CommentResponseDTO::getParentId));

        rootDtos.forEach(root -> root.setReplies(repliesByParent.getOrDefault(root.getId(), List.of())));

        Page<CommentResponseDTO> dtoPage = new PageImpl<>(rootDtos, pageable, rootPage.getTotalElements());
        return new CommentThreadResponse(PageResponse.from(dtoPage), totalAll);
    }

    private static final int MAX_MY_COMMENTS_PAGE_SIZE = 100;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponseDTO> getMyComments(Long userId, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = Math.min(Math.max(1, size), MAX_MY_COMMENTS_PAGE_SIZE);
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Comment> commentPage = commentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        if (commentPage.isEmpty()) {
            return PageResponse.from(new PageImpl<>(List.of(), pageable, 0));
        }

        List<Long> pollIds = commentPage.getContent().stream().map(c -> c.getPoll().getId()).distinct().toList();
        List<Vote> votes = voteRepository.findByUserIdAndPollIdIn(userId, pollIds);
        Map<Long, String> pollVoteMap = votes.stream()
                .collect(Collectors.toMap(
                        v -> v.getPoll().getId(),
                        v -> "Đã vote: " + v.getOption().getText(),
                        (existing, replacement) -> existing
                ));

        List<CommentResponseDTO> dtos = commentPage.getContent().stream()
                .map(comment -> {
                    String voteStatus = pollVoteMap.getOrDefault(comment.getPoll().getId(), "Chưa vote");
                    return mapToDTO(comment, voteStatus, Map.of());
                })
                .collect(Collectors.toList());
        Page<CommentResponseDTO> dtoPage = new PageImpl<>(dtos, pageable, commentPage.getTotalElements());
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO getIdentityStatus(Long pollId, Long userId) {
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (poll.getCreator().getId().equals(userId)) {
            return com.xxxx.systemvotting.modules.comment.dto.response.IdentityStatusDTO.builder()
                    .hasCommented(true)
                    .isAnonymous(poll.isAnonymous())
                    .build();
        }

        Optional<Comment> prevComment = commentRepository.findFirstByUserIdAndPollIdOrderByCreatedAtAsc(userId, pollId);
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

    private Map<Long, String> buildUserVoteLabelMap(Long pollId) {
        Map<Long, String> userVoteMap = new HashMap<>();
        for (Object[] row : voteRepository.findUserIdAndOptionTextByPollId(pollId)) {
            Long uid = ((Number) row[0]).longValue();
            String optionText = row[1] != null ? Objects.toString(row[1], "") : "";
            userVoteMap.put(uid, "Đã vote: " + optionText);
        }
        return userVoteMap;
    }

    /**
     * Stable Anonymous N labels across the whole poll (matches pre-pagination behaviour).
     */
    private Map<Long, String> buildGlobalAnonymousLabelMap(Long pollId) {
        List<Object[]> rows = commentRepository.findAnonymousParticipantOrder(pollId);
        Map<Long, String> result = new LinkedHashMap<>();
        int i = 0;
        for (Object[] row : rows) {
            Long userId = ((Number) row[0]).longValue();
            result.put(userId, "Anonymous " + (++i));
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
                .replies(List.of())
                .build();
    }
}
