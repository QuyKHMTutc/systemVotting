package com.xxxx.systemvotting.modules.comment.entity;

import com.xxxx.systemvotting.modules.common.enums.ModerationStatus;

import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments", indexes = {
    @Index(name = "idx_comment_poll_id",         columnList = "poll_id"),
    @Index(name = "idx_comment_user_id",         columnList = "user_id"),
    @Index(name = "idx_comment_poll_created_at", columnList = "poll_id, created_at"),
    @Index(name = "idx_comment_poll_parent_created", columnList = "poll_id, parent_id, created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Poll poll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    private String content;

    @Column(name = "is_anonymous", nullable = false)
    private boolean isAnonymous;

    /**
     * Trạng thái kiểm duyệt của bình luận.
     * SAFE = hiển thị ngay, SUSPICIOUS = hiển thị nhưng gắc cờ cho Admin, DANGEROUS = bị chặn.
     * Mặc định SAFE để tương thích ngược với bình luận cũ.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", nullable = false)
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.SAFE;

    /** Lý do kiểm duyệt (từ AI). */
    @Column(name = "moderation_reason", length = 500)
    private String moderationReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // The immediate parent comment (if this is a reply, exactly who is being replied to)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Comment parent;

    // The top-level root comment (for grouping all descendants into a flat 2-level UI)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Comment root;
}
