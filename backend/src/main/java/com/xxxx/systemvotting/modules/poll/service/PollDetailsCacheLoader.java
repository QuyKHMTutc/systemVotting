package com.xxxx.systemvotting.modules.poll.service;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.mapper.PollMapper;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Redis-backed cache for poll <strong>database</strong> snapshot only (creator, options text,
 * tags, comment count). Live per-option vote totals are stored separately in Redis hashes
 * and merged in {@link com.xxxx.systemvotting.modules.poll.service.impl.PollServiceImpl}
 * on every read so high-traffic vote bursts never serve stale counts from this cache.
 */
@Service
@RequiredArgsConstructor
public class PollDetailsCacheLoader {

    private final PollRepository pollRepository;
    private final PollMapper pollMapper;
    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "pollDetails", key = "#id")
    public PollResponseDTO loadDbSnapshot(Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        PollResponseDTO dto = pollMapper.toDto(poll);
        dto.setCommentCount((int) commentRepository.countByPollId(id));
        return dto;
    }
}
