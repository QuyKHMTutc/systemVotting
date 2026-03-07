package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {

    @EntityGraph(attributePaths = { "options", "creator" })
    Page<Poll> findAll(Pageable pageable);

    @EntityGraph(attributePaths = { "options", "creator" })
    Optional<Poll> findById(Long id);

    void deleteByCreator(com.xxxx.systemvotting.modules.user.entity.User creator);

    @EntityGraph(attributePaths = { "options", "creator" })
    List<Poll> findByCreatorIdOrderByIdDesc(Long creatorId);

    @EntityGraph(attributePaths = { "options", "creator" })
    @Query("SELECT p FROM Poll p JOIN Vote v ON p.id = v.poll.id WHERE v.user.id = :userId ORDER BY v.createdAt DESC")
    List<Poll> findPollsVotedByUser(@Param("userId") Long userId);
}
