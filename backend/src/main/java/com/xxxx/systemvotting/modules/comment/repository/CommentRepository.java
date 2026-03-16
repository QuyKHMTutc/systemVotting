package com.xxxx.systemvotting.modules.comment.repository;

import com.xxxx.systemvotting.modules.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPollIdOrderByCreatedAtDesc(Long pollId);

    void deleteByPoll_Id(Long pollId);

    long countByPollId(Long pollId);
}
