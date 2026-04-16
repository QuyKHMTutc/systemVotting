package com.xxxx.systemvotting.modules.notification.entity;

import com.xxxx.systemvotting.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Column(name = "actor_avatar")
    private String actorAvatar;

    // Type of notification: 'NEW_COMMENT', 'NEW_REPLY', 'NEW_VOTE'
    @Column(nullable = false)
    private String type;

    // Optional short description message
    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "related_poll_id")
    private Long relatedPollId;

    @Column(name = "related_comment_id")
    private Long relatedCommentId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
