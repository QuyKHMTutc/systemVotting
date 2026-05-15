package com.xxxx.systemvotting.modules.poll.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /**
     * URL-friendly identifier (e.g. "cong-nghe", "gaming").
     * Used for SEO-friendly filtering: /explore?category=cong-nghe
     */
    @Column(nullable = false, unique = true)
    private String slug;

    /**
     * Emoji icon displayed next to the category name (e.g. "🔥", "💻", "🎮").
     */
    @Column(nullable = false)
    private String icon;

    /**
     * Controls display order in sidebars and category pickers.
     * Lower value = displayed first.
     */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
