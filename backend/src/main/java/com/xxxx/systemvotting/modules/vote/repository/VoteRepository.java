package com.xxxx.systemvotting.modules.vote.repository;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    boolean existsByUserIdAndPollId(Long userId, Long pollId);

    Optional<Vote> findByUserIdAndPollId(Long userId, Long pollId);

    void deleteByUser(User user);

    void deleteByOptionId(Long optionId);

    List<Vote> findByPollId(Long pollId);

    /**
     * Projection for comment threads — avoids loading full {@link Vote} graphs (user/option/poll)
     * when only (userId → option label) is needed.
     */
    @Query("SELECT v.user.id, o.text FROM Vote v JOIN v.option o WHERE v.poll.id = :pollId")
    List<Object[]> findUserIdAndOptionTextByPollId(@Param("pollId") Long pollId);

    List<Vote> findByUserIdAndPollIdIn(Long userId, List<Long> pollIds);
}
