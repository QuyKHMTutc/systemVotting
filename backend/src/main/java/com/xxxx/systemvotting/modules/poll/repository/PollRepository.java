package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {

    @EntityGraph(attributePaths = { "options", "creator" })
    Page<Poll> findAll(Pageable pageable);

    @EntityGraph(attributePaths = { "options", "creator", "tags" })
    @Query("SELECT DISTINCT p FROM Poll p LEFT JOIN p.tags t WHERE " +
           "(:title IS NULL OR :title = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:tag IS NULL OR :tag = 'ALL' OR :tag = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :tag, '%'))) AND " +
           "(:status IS NULL OR :status = 'ALL' OR " +
           "(:status = 'ACTIVE' AND p.endTime > :currentTime) OR " +
           "(:status = 'ENDED' AND p.endTime <= :currentTime))")
    Page<Poll> findWithFilters(@Param("title") String title, 
                               @Param("tag") String tag, 
                               @Param("status") String status, 
                               @Param("currentTime") java.time.LocalDateTime currentTime,
                               Pageable pageable);

    @EntityGraph(attributePaths = { "options", "creator", "tags" })
    Optional<Poll> findById(Long id);

    void deleteByCreator(com.xxxx.systemvotting.modules.user.entity.User creator);

    @EntityGraph(attributePaths = { "options", "creator", "tags" })
    Page<Poll> findByCreatorId(Long creatorId, Pageable pageable);

    @EntityGraph(attributePaths = { "options", "creator", "tags" })
    @Query("SELECT p FROM Poll p JOIN Vote v ON p.id = v.poll.id WHERE v.user.id = :userId ORDER BY v.createdAt DESC")
    Page<Poll> findPollsVotedByUser(@Param("userId") Long userId, Pageable pageable);

    long countByCreator_Id(Long creatorId);

    @Query("SELECT COUNT(p) FROM Poll p WHERE p.creator.id = :creatorId AND (p.endTime IS NULL OR p.endTime > :now)")
    long countActiveByCreator(@Param("creatorId") Long creatorId, @Param("now") java.time.LocalDateTime now);
}
