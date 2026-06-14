package com.xxxx.systemvotting.modules.comment.repository;

import com.xxxx.systemvotting.modules.comment.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * Fetches comments for a poll with user, poll, and parent eagerly loaded.
     * @EntityGraph prevents N+1 queries when accessing comment.getUser(), comment.getPoll(), etc.
     * Without this: 1 poll with 100 comments = 201 SQL queries. With this: 1 JOIN query.
     */
    @EntityGraph(attributePaths = {"user", "poll", "parent"})
    @Query("SELECT c FROM Comment c WHERE c.poll.id = :pollId AND c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS ORDER BY c.createdAt DESC")
    List<Comment> findByPollIdOrderByCreatedAtDesc(@Param("pollId") Long pollId);

    /**
     * Root-level comments only (parent IS NULL), newest first — for pagination.
     */
    @EntityGraph(attributePaths = {"user", "poll"})
    @Query("SELECT c FROM Comment c WHERE c.poll.id = :pollId AND c.parent IS NULL AND c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS ORDER BY c.createdAt DESC")
    Page<Comment> findRootCommentsByPollId(@Param("pollId") Long pollId, Pageable pageable);

    /**
     * Direct and deep replies for the given root comment ids (uses root_id or fallback to parent_id for legacy data).
     */
    @EntityGraph(attributePaths = {"user", "poll", "parent", "root"})
    @Query("SELECT c FROM Comment c WHERE c.poll.id = :pollId AND (c.root.id IN :rootIds OR (c.root IS NULL AND c.parent.id IN :rootIds)) AND c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS ORDER BY c.createdAt ASC")
    List<Comment> findRepliesForRoots(@Param("pollId") Long pollId, @Param("rootIds") Collection<Long> rootIds);

    /**
     * Global anonymous label order for a poll (one row per anonymous user, chronological).
     */
    @Query("SELECT c.user.id, MIN(c.createdAt) FROM Comment c WHERE c.poll.id = :pollId AND c.isAnonymous = true AND c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS GROUP BY c.user.id ORDER BY MIN(c.createdAt)")
    List<Object[]> findAnonymousParticipantOrder(@Param("pollId") Long pollId);

    /**
     * Fetches a user's comments with related poll info eagerly loaded.
     */
    @EntityGraph(attributePaths = {"user", "poll"})
    Page<Comment> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Lấy comment của user trong trang Profile, loại trừ comment bị DANGEROUS (admin chặn).
     * Comment SUSPICIOUS (chờ duyệt) vẫn hiển để user biết trạng thái.
     */
    @EntityGraph(attributePaths = {"user", "poll"})
    @Query("SELECT c FROM Comment c WHERE c.user.id = :userId AND (c.moderationStatus IS NULL OR c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS) ORDER BY c.createdAt DESC")
    Page<Comment> findByUserIdExcludingDangerous(@Param("userId") Long userId, Pageable pageable);

    /**
     * Used for identity-consistency checks (anonymous vs named).
     * Fetches first comment in chronological order (LIMIT 1).
     */
    Optional<Comment> findFirstByUserIdAndPollIdOrderByCreatedAtAsc(Long userId, Long pollId);

    void deleteByPoll_Id(Long pollId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Comment c WHERE c.root.id = :id OR (c.root IS NULL AND c.parent.id = :id) OR c.parent.id = :id")
    void deleteByRootOrParentId(@Param("id") Long id);

    @Query("SELECT c.id FROM Comment c WHERE c.root.id = :id OR (c.root IS NULL AND c.parent.id = :id) OR c.parent.id = :id")
    List<Long> findReplyIdsByRootOrParentId(@Param("id") Long id);

    long countByPollId(Long pollId);

    /**
     * Đếm comment hiển thị công khai (SAFE + SUSPICIOUS): không đếm bình luận bị DANGEROUS.
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.poll.id = :pollId AND c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS")
    long countVisibleByPollId(@Param("pollId") Long pollId);

    /**
     * Batch count of comments across multiple polls — only visible comments (non-DANGEROUS).
     */
    @Query("SELECT c.poll.id, COUNT(c) FROM Comment c WHERE c.poll.id IN :pollIds AND (c.moderationStatus IS NULL OR c.moderationStatus <> com.xxxx.systemvotting.common.enums.ModerationStatus.DANGEROUS) GROUP BY c.poll.id")
    List<Object[]> countCommentsByPollIds(@Param("pollIds") List<Long> pollIds);

    /** Admin moderation: Lấy danh sách bình luận bị gắn cờ SUSPICIOUS. */
    @EntityGraph(attributePaths = {"user", "poll"})
    @Query("SELECT c FROM Comment c WHERE c.moderationStatus = com.xxxx.systemvotting.common.enums.ModerationStatus.SUSPICIOUS ORDER BY c.createdAt DESC")
    Page<Comment> findSuspiciousComments(Pageable pageable);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.moderationStatus = com.xxxx.systemvotting.common.enums.ModerationStatus.SUSPICIOUS")
    long countSuspiciousComments();
}
