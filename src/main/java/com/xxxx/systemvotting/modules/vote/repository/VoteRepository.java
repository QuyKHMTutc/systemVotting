package com.xxxx.systemvotting.modules.vote.repository;

import com.xxxx.systemvotting.modules.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    boolean existsByUserIdAndPollId(Long userId, Long pollId);
    
    java.util.Optional<com.xxxx.systemvotting.modules.vote.entity.Vote> findByUserIdAndPollId(Long userId, Long pollId);

    void deleteByUser(com.xxxx.systemvotting.modules.user.entity.User user);

    void deleteByOptionId(Long optionId);
}
