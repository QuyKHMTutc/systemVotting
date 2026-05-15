package com.xxxx.systemvotting.modules.poll.entity;

import com.xxxx.systemvotting.modules.poll.enums.PollVisibility;
import com.xxxx.systemvotting.modules.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import com.xxxx.systemvotting.modules.poll.entity.Category;
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
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "polls", indexes = {
    @Index(name = "idx_poll_creator_id", columnList = "creator_id"),
    @Index(name = "idx_poll_end_time",   columnList = "end_time"),
    @Index(name = "idx_poll_created_at", columnList = "created_at"),
    @Index(name = "idx_poll_creator_end_time", columnList = "creator_id, end_time")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Poll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    // NEW: Tags & Privacy
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "poll_tags",
        joinColumns = @JoinColumn(name = "poll_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Tag> tags = new HashSet<>();

    @Column(name = "is_anonymous", nullable = false)
    private boolean isAnonymous;

    // NEW: Time constraints
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(name = "judge_weight", nullable = false)
    @Builder.Default
    private Integer judgeWeight = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    @Builder.Default
    private PollVisibility visibility = PollVisibility.PUBLIC;

    /**
     * Danh sách email được mời tham gia bình chọn (chỉ áp dụng cho PRIVATE poll).
     * Lưu trực tiếp email, không yêu cầu email phải có tài khoản trong hệ thống.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "poll_invited_emails", joinColumns = @JoinColumn(name = "poll_id"))
    @Column(name = "email")
    @Builder.Default
    private java.util.List<String> invitedEmails = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User creator;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Option> options = new LinkedHashSet<>();

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<PollMember> members = new LinkedHashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper method to keep synchronization
    public void addOption(Option option) {
        options.add(option);
        option.setPoll(this);
    }

    public void removeOption(Option option) {
        options.remove(option);
        option.setPoll(null);
    }
}
