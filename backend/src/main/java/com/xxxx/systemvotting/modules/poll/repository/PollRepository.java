package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.enums.PollVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {

    // ─── Phân trang chính ─────────────────────────────────────────────────────
    // Quy tắc: KHÔNG dùng JOIN FETCH với collection (OneToMany / ManyToMany) khi có Pageable.
    // Thay vào đó, dùng @BatchSize trên entity để Hibernate batch-load collection sau khi phân trang.
    // Chỉ được JOIN FETCH với ManyToOne (ví dụ creator) vì không nhân dòng.

    @Query(value =
           "SELECT DISTINCT p FROM Poll p " +
           "LEFT JOIN FETCH p.creator " +
           "LEFT JOIN p.tags t " +
           "WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND (:title IS NULL OR :title = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:tag IS NULL OR :tag = 'ALL' OR :tag = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :tag, '%'))) " +
           "AND (:status IS NULL OR :status = 'ALL' OR " +
           "(:status = 'ACTIVE' AND p.endTime > :currentTime) OR " +
           "(:status = 'ENDED' AND p.endTime <= :currentTime))",
           countQuery =
           "SELECT COUNT(DISTINCT p) FROM Poll p " +
           "LEFT JOIN p.tags t " +
           "WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND (:title IS NULL OR :title = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:tag IS NULL OR :tag = 'ALL' OR :tag = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :tag, '%'))) " +
           "AND (:status IS NULL OR :status = 'ALL' OR " +
           "(:status = 'ACTIVE' AND p.endTime > :currentTime) OR " +
           "(:status = 'ENDED' AND p.endTime <= :currentTime))")
    Page<Poll> findWithFilters(
            @Param("title") String title,
            @Param("tag") String tag,
            @Param("status") String status,
            @Param("currentTime") java.time.LocalDateTime currentTime,
            Pageable pageable);

    @Query(value =
           "SELECT DISTINCT p FROM Poll p " +
           "LEFT JOIN FETCH p.creator " +
           "LEFT JOIN p.tags t " +
           "LEFT JOIN p.category c " +
           "WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND (:title IS NULL OR :title = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:tag IS NULL OR :tag = 'ALL' OR :tag = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :tag, '%'))) " +
           "AND (:categorySlug IS NULL OR :categorySlug = '' OR c.slug = :categorySlug) " +
           "AND (:status IS NULL OR :status = 'ALL' " +
           "  OR (:status = 'ACTIVE' AND p.endTime > :currentTime) " +
           "  OR (:status = 'ENDED' AND p.endTime <= :currentTime))",
           countQuery =
           "SELECT COUNT(DISTINCT p) FROM Poll p " +
           "LEFT JOIN p.tags t " +
           "LEFT JOIN p.category c " +
           "WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND (:title IS NULL OR :title = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:tag IS NULL OR :tag = 'ALL' OR :tag = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :tag, '%'))) " +
           "AND (:categorySlug IS NULL OR :categorySlug = '' OR c.slug = :categorySlug) " +
           "AND (:status IS NULL OR :status = 'ALL' " +
           "  OR (:status = 'ACTIVE' AND p.endTime > :currentTime) " +
           "  OR (:status = 'ENDED' AND p.endTime <= :currentTime))")
    Page<Poll> findWithFiltersAndCategory(
            @Param("title") String title,
            @Param("tag") String tag,
            @Param("status") String status,
            @Param("categorySlug") String categorySlug,
            @Param("currentTime") java.time.LocalDateTime currentTime,
            Pageable pageable);

    /**
     * Đếm số poll PUBLIC để kiểm tra limit của creator (chỉ tính poll PUBLIC trong limit).
     * Không cần fetch collection — chỉ cần danh sách đơn giản.
     */
    @Query("SELECT DISTINCT p FROM Poll p LEFT JOIN p.tags t WHERE " +
           "p.visibility = :visibility AND p.creator.id = :creatorId")
    List<Poll> findByVisibilityAndCreatorId(
            @Param("visibility") PollVisibility visibility,
            @Param("creatorId") Long creatorId);

    Optional<Poll> findById(Long id);

    void deleteByCreator(com.xxxx.systemvotting.modules.user.entity.User creator);

    Page<Poll> findByCreatorId(Long creatorId, Pageable pageable);

    /**
     * Lấy poll của creator, loại trừ poll bị DANGEROUS (admin từ chối).
     * Poll SUSPICIOUS (chờ duyệt) vẫn hiển thị để người tạo biết trạng thái.
     * Không JOIN FETCH collection — để @BatchSize xử lý.
     */
    @Query(value =
           "SELECT p FROM Poll p LEFT JOIN FETCH p.creator " +
           "WHERE p.creator.id = :creatorId " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus <> com.xxxx.systemvotting.modules.common.enums.ModerationStatus.DANGEROUS) " +
           "ORDER BY p.id DESC",
           countQuery =
           "SELECT COUNT(p) FROM Poll p " +
           "WHERE p.creator.id = :creatorId " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus <> com.xxxx.systemvotting.modules.common.enums.ModerationStatus.DANGEROUS)")
    Page<Poll> findByCreatorIdExcludingDangerous(@Param("creatorId") Long creatorId, Pageable pageable);

    @Query(value =
           "SELECT p FROM Poll p LEFT JOIN FETCH p.creator " +
           "JOIN Vote v ON p.id = v.poll.id WHERE v.user.id = :userId ORDER BY v.createdAt DESC",
           countQuery =
           "SELECT COUNT(DISTINCT p) FROM Poll p JOIN Vote v ON p.id = v.poll.id WHERE v.user.id = :userId")
    Page<Poll> findPollsVotedByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT p.creator.id FROM Poll p WHERE p.id = :pollId")
    Optional<Long> findCreatorIdByPollId(@Param("pollId") Long pollId);

    List<Poll> findTop5ByCategoryIdAndIdNotOrderByCreatedAtDesc(Long categoryId, Long id);

    long countByCreator_Id(Long creatorId);

    /**
     * Trending: trả về List (không phân trang theo offset), dùng Pageable chỉ để giới hạn size.
     * Không cần JOIN FETCH collection vì đây là List, không phải Page — @BatchSize sẽ tự batch load.
     */
    @Query("SELECT DISTINCT p FROM Poll p LEFT JOIN FETCH p.creator " +
           "WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND p.endTime > :currentTime " +
           "AND p.createdAt >= :since " +
           "ORDER BY p.createdAt DESC")
    List<Poll> findRecentPublicActivePolls(
            @Param("currentTime") java.time.LocalDateTime currentTime,
            @Param("since") java.time.LocalDateTime since,
            Pageable pageable);

    @Query("SELECT COUNT(p) FROM Poll p WHERE p.creator.id = :creatorId AND (p.endTime IS NULL OR p.endTime > :now)")
    long countActiveByCreator(@Param("creatorId") Long creatorId, @Param("now") java.time.LocalDateTime now);

    @Query("SELECT COUNT(p) FROM Poll p WHERE (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) AND p.endTime > :now AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE)")
    long countPublicActivePolls(@Param("now") java.time.LocalDateTime now);

    /** Queries for Admin Moderation: get polls pending review (SUSPICIOUS status). */
    @Query(value =
           "SELECT p FROM Poll p LEFT JOIN FETCH p.creator " +
           "WHERE p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SUSPICIOUS " +
           "ORDER BY p.createdAt DESC",
           countQuery =
           "SELECT COUNT(p) FROM Poll p WHERE p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SUSPICIOUS")
    Page<Poll> findSuspiciousPolls(Pageable pageable);

    @Query("SELECT COUNT(p) FROM Poll p WHERE p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SUSPICIOUS")
    long countSuspiciousPolls();

    @Query("SELECT p.category.id, COUNT(p) FROM Poll p WHERE p.category IS NOT NULL " +
           "AND (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "GROUP BY p.category.id")
    List<Object[]> countPollsByCategory();

    List<Poll> findByCategory_Id(Long categoryId);

    /**
     * Đếm số poll ACTIVE (chưa kết thúc) công khai, đã được duyệt (SAFE) theo category.
     * Dùng cho badge "Số lượng" trong danh mục sidebar — khớp với chế độ "Mới nhất" (chỉ hiện ACTIVE polls).
     */
    @Query("SELECT p.category.id, COUNT(p) FROM Poll p WHERE p.category IS NOT NULL " +
           "AND (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND p.endTime > :now " +
           "GROUP BY p.category.id")
    List<Object[]> countActivePollsByCategory(@Param("now") java.time.LocalDateTime now);

    /**
     * Đếm số poll ĐÃ KẾT THÚC (endTime <= now) công khai, đã được duyệt (SAFE) theo category.
     * Dùng cho badge danh mục sidebar khi user chọn bộ lọc "Đã kết thúc".
     */
    @Query("SELECT p.category.id, COUNT(p) FROM Poll p WHERE p.category IS NOT NULL " +
           "AND (p.visibility IS NULL OR p.visibility <> com.xxxx.systemvotting.modules.poll.enums.PollVisibility.PRIVATE) " +
           "AND (p.moderationStatus IS NULL OR p.moderationStatus = com.xxxx.systemvotting.modules.common.enums.ModerationStatus.SAFE) " +
           "AND p.endTime <= :now " +
           "GROUP BY p.category.id")
    List<Object[]> countEndedPollsByCategory(@Param("now") java.time.LocalDateTime now);
}
