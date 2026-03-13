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

        // 6. Update Option Vote Count only after Vote is persisted successfully
        option.setVoteCount(option.getVoteCount() + 1);
        optionRepository.save(option);
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
