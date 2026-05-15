package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    Optional<Category> findByName(String name);
    boolean existsBySlug(String slug);
}
