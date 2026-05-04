package com.xxxx.systemvotting.modules.poll.entity;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.poll.enums.PollRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poll_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"poll_id", "user_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Integer weight = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PollRole role = PollRole.JUDGE;
}
