package com.xxxx.systemvotting.modules.poll.repository;

import com.xxxx.systemvotting.modules.poll.entity.PollMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PollMemberRepository extends JpaRepository<PollMember, Long> {
    Optional<PollMember> findByPollIdAndUserId(Long pollId, Long userId);
    List<PollMember> findByPollId(Long pollId);
}
