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
    List<Comment> findByPollIdOrderByCreatedAtDesc(Long pollId);

    /**
     * Root-level comments only (parent IS NULL), newest first — for pagination.
     */
    @EntityGraph(attributePaths = {"user", "poll"})
    @Query("SELECT c FROM Comment c WHERE c.poll.id = :pollId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    Page<Comment> findRootCommentsByPollId(@Param("pollId") Long pollId, Pageable pageable);

    /**
     * Direct replies for the given root comment ids (flat under root — see createComment logic).
     */
    @EntityGraph(attributePaths = {"user", "poll", "parent"})
    @Query("SELECT c FROM Comment c WHERE c.poll.id = :pollId AND c.parent.id IN :parentIds ORDER BY c.createdAt ASC")
    List<Comment> findRepliesForRoots(@Param("pollId") Long pollId, @Param("parentIds") Collection<Long> parentIds);

    /**
     * Global anonymous label order for a poll (one row per anonymous user, chronological).
     */
    @Query("SELECT c.user.id, MIN(c.createdAt) FROM Comment c WHERE c.poll.id = :pollId AND c.isAnonymous = true GROUP BY c.user.id ORDER BY MIN(c.createdAt)")
    List<Object[]> findAnonymousParticipantOrder(@Param("pollId") Long pollId);

    /**
     * Fetches a user's comments with related poll info eagerly loaded.
     */
    @EntityGraph(attributePaths = {"user", "poll"})
    List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Used for identity-consistency checks (anonymous vs named).
     * Fetches first comment in chronological order (LIMIT 1).
     */
    Optional<Comment> findFirstByUserIdAndPollIdOrderByCreatedAtAsc(Long userId, Long pollId);

    void deleteByPoll_Id(Long pollId);

    long countByPollId(Long pollId);

    /**
     * Batch count of comments across multiple polls — single query instead of N queries.
     * Used by PollService to enrich poll lists without N+1 DB calls.
     */
    @Query("SELECT c.poll.id, COUNT(c) FROM Comment c WHERE c.poll.id IN :pollIds GROUP BY c.poll.id")
    List<Object[]> countCommentsByPollIds(@Param("pollIds") List<Long> pollIds);
}
