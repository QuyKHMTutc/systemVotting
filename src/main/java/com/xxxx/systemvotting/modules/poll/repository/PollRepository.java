package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.Poll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {

    @EntityGraph(attributePaths = { "options", "creator" })
    Page<Poll> findAll(Pageable pageable);

    @EntityGraph(attributePaths = { "options", "creator" })
    Optional<Poll> findById(Long id);
}
