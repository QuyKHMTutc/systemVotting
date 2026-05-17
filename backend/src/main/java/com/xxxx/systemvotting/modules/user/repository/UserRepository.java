package com.xxxx.systemvotting.modules.user.repository;

import com.xxxx.systemvotting.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    java.util.List<User> findByUsernameIn(java.util.Collection<String> usernames);

    java.util.List<User> findByEmailIn(java.util.Collection<String> emails);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<User> searchUsers(@org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);
}
