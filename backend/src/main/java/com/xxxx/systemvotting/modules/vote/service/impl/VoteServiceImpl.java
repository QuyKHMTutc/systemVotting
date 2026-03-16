package com.xxxx.systemvotting.modules.vote.service.impl;

import com.xxxx.systemvotting.exception.custom.BadRequestException;
import com.xxxx.systemvotting.exception.custom.DuplicateResourceException;
import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.OptionRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.common.service.RealTimeService;
import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.mapper.VoteMapper;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import com.xxxx.systemvotting.modules.vote.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VoteServiceImpl implements VoteService {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final PollRepository pollRepository;
    private final OptionRepository optionRepository;
    private final VoteMapper voteMapper;
    private final com.xxxx.systemvotting.common.service.BaseRedisService<String, String, Object> redisService;
    private final RealTimeService realTimeService;

    private static final String POLL_CACHE_PREFIX = "poll:details:";

    @Override
    @Transactional
    public VoteResponseDTO submitVote(VoteRequestDTO requestDTO) {
        // 1. Verify Entities exist
        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestDTO.getUserId()));

        Poll poll = pollRepository.findById(requestDTO.getPollId())
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + requestDTO.getPollId()));

        Option option = optionRepository.findById(requestDTO.getOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + requestDTO.getOptionId()));

        // 2. Validate Option belongs to Poll
        if (!option.getPoll().getId().equals(poll.getId())) {
            throw new BadRequestException("Option does not belong to the specified Poll");
        }

        // 3. Validate Time Constraints
        LocalDateTime now = LocalDateTime.now();
        if (poll.getStartTime() != null && now.isBefore(poll.getStartTime())) {
            throw new BadRequestException("The poll has not started yet");
        }
        if (poll.getEndTime() != null && now.isAfter(poll.getEndTime())) {
            throw new BadRequestException("The poll has already ended");
        }

        // 4. Prevent duplicate voting
        if (voteRepository.existsByUserIdAndPollId(user.getId(), poll.getId())) {
            throw new DuplicateResourceException("User has already voted for this poll");
        }

        // 5. Create and save Vote first (DB unique constraint prevents race condition)
        //    If we incremented option.voteCount first, a concurrent request could pass
        //    the duplicate check and cause voteCount to be wrong when one save fails.
        Vote vote = voteMapper.toEntity(requestDTO);
        vote.setUser(user);
        vote.setPoll(poll);
        vote.setOption(option);

        Vote savedVote = voteRepository.save(vote);
        
        // 6. Update Option Vote Count using atomic query to prevent race conditions
        optionRepository.incrementVoteCount(option.getId());

        // 7. Evict Poll Cache to ensure updated results are shown
        redisService.delete(POLL_CACHE_PREFIX + poll.getId());

        // 8. Broadcast updated vote counts to all WebSocket subscribers.
        //    We do NOT reload from DB because pollRepository.findById() within the same @Transactional
        //    returns the JPA first-level cache entity which still has the old voteCount
        //    (incrementVoteCount is a JPQL bulk update that bypasses the cache).
        //    Instead, we build the payload directly: +1 for the voted option, unchanged for others.
        java.util.List<java.util.Map<String, Object>> optionUpdates = poll.getOptions().stream()
                .map(o -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("optionId", o.getId());
                    m.put("text", o.getText());
                    int count = o.getId().equals(option.getId()) ? o.getVoteCount() + 1 : o.getVoteCount();
                    m.put("voteCount", count);
                    return m;
                }).collect(java.util.stream.Collectors.toList());
        java.util.Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("pollId", poll.getId());
        payload.put("options", optionUpdates);
        realTimeService.broadcast("/topic/polls/" + poll.getId() + "/votes", payload);

        return voteMapper.toDto(savedVote);

    }

    @Override
    @Transactional(readOnly = true)
    public com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO checkVote(Long userId, Long pollId) {
        return voteRepository.findByUserIdAndPollId(userId, pollId)
                .map(vote -> com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO.builder()
                        .hasVoted(true)
                        .optionId(vote.getOption().getId())
                        .build())
                .orElse(com.xxxx.systemvotting.modules.vote.dto.response.VoteCheckResponseDTO.builder()
                        .hasVoted(false)
                        .build());
    }
}
