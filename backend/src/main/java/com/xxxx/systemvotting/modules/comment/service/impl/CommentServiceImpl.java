package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.cache.CommentCacheInvalidator;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentThreadResponse;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.entity.CommentLike;
import com.xxxx.systemvotting.modules.comment.repository.CommentLikeRepository;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.notification.service.AsyncNotificationService;
import com.xxxx.systemvotting.modules.notification.service.NotificationService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.common.service.imp.AiModerationService;
import com.xxxx.systemvotting.modules.common.enums.ModerationStatus;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
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
    private final CommentLikeRepository commentLikeRepository;
    private final AsyncNotificationService asyncNotificationService;

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

        // --- AI Moderation: kiểm duyệt nội dung bình luận (có cache + rate limiting) ---
        AiModerationService.ModerationResult modResult = aiModerationService.moderateContent(request.content(), userId);

        if (modResult.status() == ModerationStatus.DANGEROUS) {
            log.warn("[Moderation] Comment bị chặn - DANGEROUS. Nội dung: '{}'", request.content().substring(0, Math.min(50, request.content().length())));
            throw new AppException(ErrorCode.CONTENT_DANGEROUS);
        }

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(request.content())
                .isAnonymous(request.isAnonymous())
                .moderationStatus(modResult.status())
                .moderationReason(modResult.reason());

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

        Map<Long, String> anonymousDisplayNames = comment.isAnonymous()
                ? buildGlobalAnonymousLabelMap(poll.getId())
                : Map.of();

        String actorName = comment.isAnonymous() 
                ? anonymousDisplayNames.getOrDefault(currentUser.getId(), "Người dùng ẩn danh") 
                : currentUser.getUsername();
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

        // anonymousDisplayNames was already calculated above

        CommentResponseDTO responseDTO = mapToDTO(comment, voteStatus, anonymousDisplayNames, 0L, false, true);

        realTimeService.broadcast("/topic/polls/" + poll.getId() + "/comments", responseDTO);

        // Count fresh comment total so the Explore page cards show the correct number
        long freshCommentCount = commentRepository.countByPollId(poll.getId());
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("type", "COMMENT_ADDED");
        eventPayload.put("pollId", poll.getId());
        eventPayload.put("commentCount", freshCommentCount);
        realTimeService.broadcast("/topic/polls/events", eventPayload);

        commentCacheInvalidator.evictAllPagesForPoll(poll.getId());

        return responseDTO;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "comments", key = "#pollId + ':' + #page + ':' + #size + ':' + (#currentUserId != null ? #currentUserId : 'anon')")
    public CommentThreadResponse getCommentsByPollId(Long pollId, int page, int size, Long currentUserId) {
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

        // Bulk-load like counts for all comments
        List<Long> allCommentIds = combined.stream().map(Comment::getId).toList();
        Map<Long, Long> likeCountMap = new HashMap<>();
        for (Object[] row : commentLikeRepository.countByCommentIdIn(allCommentIds)) {
            likeCountMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }

        // Bulk-load user likes
         Set<Long> userLikedIds = new HashSet<>();
        if (currentUserId != null && !allCommentIds.isEmpty()) {
            userLikedIds.addAll(commentLikeRepository.findLikedCommentIdsByUser(allCommentIds, currentUserId));
        }

        List<CommentResponseDTO> flat = combined.stream()
                .map(c -> mapToDTO(c, userVoteMap.getOrDefault(c.getUser().getId(), "Chưa vote"), anonymousLabels,
                        likeCountMap.getOrDefault(c.getId(), 0L), userLikedIds.contains(c.getId()),
                        currentUserId != null && currentUserId.equals(c.getUser().getId())))
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
        // Dùng query loại trừ DANGEROUS: user chỉ thấy comment SAFE + SUSPICIOUS (chờ duyệt)
        Page<Comment> commentPage = commentRepository.findByUserIdExcludingDangerous(userId, pageable);
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

        Map<Long, Map<Long, String>> pollAnonymousNamesMap = new HashMap<>();
        for (Long pollId : pollIds) {
            pollAnonymousNamesMap.put(pollId, buildGlobalAnonymousLabelMap(pollId));
        }

        List<CommentResponseDTO> dtos = commentPage.getContent().stream()
                .map(comment -> {
                    String voteStatus = pollVoteMap.getOrDefault(comment.getPoll().getId(), "Chưa vote");
                    Map<Long, String> anonymousDisplayNames = pollAnonymousNamesMap.getOrDefault(comment.getPoll().getId(), Map.of());
                    return mapToDTO(comment, voteStatus, anonymousDisplayNames);
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

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!comment.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN); // Or UNAUTHORIZED / NO_PERMISSION
        }

        Long pollId = comment.getPoll().getId();

        // If it's a root comment, delete all its replies first
        if (comment.getParent() == null) {
            List<Long> replyIds = commentRepository.findReplyIdsByParentId(commentId);
            if (!replyIds.isEmpty()) {
                commentLikeRepository.deleteByCommentIdIn(replyIds);
            }
            commentRepository.deleteByParentId(commentId);
        }

        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);

        // Invalidate cache
        commentCacheInvalidator.evictAllPagesForPoll(pollId);

        // Fetch fresh comment count
        long freshCommentCount = commentRepository.countByPollId(pollId);

        // Broadcast event
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("type", "COMMENT_DELETED");
        eventPayload.put("pollId", pollId);
        eventPayload.put("commentId", commentId);
        eventPayload.put("commentCount", freshCommentCount);
        realTimeService.broadcast("/topic/polls/events", eventPayload);
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
    private static final String[] ANONYMOUS_NOUNS = {
        "Cáo 🦊", "Sói 🐺", "Gấu Trúc 🐼", "Thỏ 🐰", "Hải Cẩu 🦭", "Cá Heo 🐬", "Mèo 🐱", "Cún 🐶", "Sư Tử 🦁", "Hổ 🐯",
        "Báo 🐆", "Rái Cá 🦦", "Chim Cánh Cụt 🐧", "Sóc 🐿️", "Hươu Cao Cổ 🦒", "Ngựa Vằn 🦓", "Đà Điểu 🦩", "Cá Mập 🦈", "Bạch Tuộc 🐙", "Tê Giác 🦏",
        "Hà Mã 🦛", "Lạc Đà 🐪", "Llama 🦙", "Khủng Long 🦖", "Koala 🐨", "Chuột Túi 🦘", "Lửng Mật 🦡", "Nhím 🦔", "Rùa 🐢", "Khỉ 🐵",
        "Cá Voi 🐳", "Cú Tuyết 🦉", "Thiên Nga 🦢", "Ốc Sên 🐌", "Tắc Kè 🦎", "Gà Tây 🦃", "Cừu 🐑", "Dê 🐐", "Bò Sữa 🐄", "Trâu 🐃",
        "Heo Rừng 🐗", "Hamster 🐹", "Gấu 🐻", "Khỉ Đột 🦍", "Voi 🐘", "Bồ Nông 🦤", "Cú Mèo 🦉", "Hươu 🦌", "Chuột Lang 🐹", "Chim Ưng 🦅"
    };

    private static final String[] ANONYMOUS_ADJECTIVES = {
        "Vui Vẻ", "Lười Biếng", "Nhanh Nhẹn", "Ngơ Ngác", "Bí Ẩn", "Dũng Cảm", "Nhút Nhát", "Lém Lỉnh", "Thích Thú", "Bực Bội",
        "Ngủ Gật", "Ngốc Nghếch", "Xinh Xắn", "Béo Mập", "Lầm Lì", "Lạc Quan", "Tò Mò", "Hoạt Bát", "Dễ Thương", "Can Đảm",
        "Thông Minh", "Ngu Ngơ", "Xảo Quyệt", "Hóm Hỉnh", "Thân Thiện", "Lạnh Lùng", "Kiêu Ngạo", "Dịu Dàng", "Ngổ Ngáo", "Khờ Khạo",
        "Đáng Yêu", "Bướng Bỉnh", "Trầm Tính", "Ồn Ào", "Rụt Rè", "Điềm Đạm", "Hiếu Động", "Say Sưa", "Tinh Nghịch", "Cáu Kỉnh",
        "Buồn Bã", "Lơ Đãng", "Hay Quên", "Vội Vã", "Thảnh Thơi", "Chăm Chỉ", "Mơ Mộng", "Hào Phóng", "Lãng Mạn", "Khó Tính"
    };

    /**
     * Stable Adjective + Noun labels across the whole poll.
     * Guarantees 2500 unique names before appending cycle numbers.
     */
    private Map<Long, String> buildGlobalAnonymousLabelMap(Long pollId) {
        List<Object[]> rows = commentRepository.findAnonymousParticipantOrder(pollId);
        Map<Long, String> result = new LinkedHashMap<>();
        int i = 0;
        int maxCombinations = ANONYMOUS_NOUNS.length * ANONYMOUS_ADJECTIVES.length;
        
        Poll poll = pollRepository.findById(pollId).orElse(null);
        Long creatorId = (poll != null && poll.getCreator() != null) ? poll.getCreator().getId() : null;
        
        int seed = (int) (pollId % maxCombinations);
        
        for (Object[] row : rows) {
            Long userId = ((Number) row[0]).longValue();
            
            if (creatorId != null && creatorId.equals(userId)) {
                result.put(userId, com.xxxx.systemvotting.common.utils.AnonymousIdentityUtil.getCreatorAnonymousName(pollId));
                continue;
            }
            
            int shiftedIndex = seed + i;
            int nounIndex = shiftedIndex % ANONYMOUS_NOUNS.length;
            int adjIndex = (shiftedIndex / ANONYMOUS_NOUNS.length) % ANONYMOUS_ADJECTIVES.length;
            int cycle = i / maxCombinations;
            
            String noun = ANONYMOUS_NOUNS[nounIndex];
            String adj = ANONYMOUS_ADJECTIVES[adjIndex];
            
            // Format: "Cáo Vui Vẻ 🦊"
            String animalName = noun.substring(0, noun.length() - 2).trim();
            String emoji = noun.substring(noun.length() - 2).trim();
            
            String fullName = animalName + " " + adj + " " + emoji;
            
            if (cycle > 0) {
                fullName += " (" + cycle + ")";
            }
            
            result.put(userId, fullName);
            i++;
        }
        return result;
    }

    private CommentResponseDTO mapToDTO(Comment comment, String voteStatus, Map<Long, String> anonymousDisplayNames) {
        return mapToDTO(comment, voteStatus, anonymousDisplayNames, 0L, false, false);
    }

    private CommentResponseDTO mapToDTO(Comment comment, String voteStatus, Map<Long, String> anonymousDisplayNames, long likeCount, boolean likedByMe) {
        return mapToDTO(comment, voteStatus, anonymousDisplayNames, likeCount, likedByMe, false);
    }

    private CommentResponseDTO mapToDTO(Comment comment, String voteStatus, Map<Long, String> anonymousDisplayNames, long likeCount, boolean likedByMe, boolean isOwner) {
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
                .likeCount(likeCount)
                .likedByMe(likedByMe)
                .isOwner(isOwner)
                .replies(List.of())
                .build();
    }

    @Override
    @Transactional
    public boolean toggleLike(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        boolean alreadyLiked = commentLikeRepository.existsByCommentIdAndUserId(commentId, userId);

        if (alreadyLiked) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);
            if (comment.getPoll() != null) {
                commentCacheInvalidator.evictAllPagesForPoll(comment.getPoll().getId());
            }
            return false;
        } else {
            CommentLike like = CommentLike.builder()
                    .comment(comment)
                    .user(user)
                    .build();
            commentLikeRepository.save(like);

            if (comment.getPoll() != null) {
                commentCacheInvalidator.evictAllPagesForPoll(comment.getPoll().getId());
            }

            // Notify the comment author (not if self-like)
            if (!comment.getUser().getId().equals(userId)) {
                String actorName = user.getUsername();
                String actorAvatar = user.getAvatarUrl();

                asyncNotificationService.createNotificationAsync(
                        comment.getUser().getId(),
                        actorName,
                        actorAvatar,
                        "COMMENT_LIKED",
                        comment.getContent().length() > 80
                                ? comment.getContent().substring(0, 80).trim() + "..."
                                : comment.getContent(),
                        comment.getPoll() != null ? comment.getPoll().getId() : null,
                        comment.getId()
                );
            }
            return true;
        }
    }
}
