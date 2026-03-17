package com.xxxx.systemvotting.modules.vote.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxxx.systemvotting.common.utils.RedisKeyUtils;
import com.xxxx.systemvotting.modules.vote.dto.VoteEventDTO;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoteEventConsumer {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final VoteRepository voteRepository;
    private final PollRepository pollRepository;
    private final UserRepository userRepository;

    /**
     * Polls the Redis list every 2 seconds for new voting events to sync to the database.
     */
    @Scheduled(fixedDelay = 2000)
    public void processVoteEvents() {
        String queueKey = RedisKeyUtils.getVoteEventQueueKey();

        boolean processing = true;
        while (processing) {
            try {
                // Block for up to 1 second waiting for an item in the queue (less than default 2s redis timeout)
                String eventJson = redisTemplate.opsForList().rightPop(queueKey, Duration.ofSeconds(1));
                
                if (eventJson == null) {
                    processing = false; // Queue empty, wait for next scheduled run
                    continue;
                }

                VoteEventDTO event = objectMapper.readValue(eventJson, VoteEventDTO.class);
                log.info("Processing async vote event: {}", event);
                
                processSingleEventToDatabase(event);

            } catch (Exception e) {
                log.error("Error processing vote event from queue. Note: DLQ fallback would be implemented here in production.", e);
                processing = false;
            }
        }
    }

    @Transactional
    protected void processSingleEventToDatabase(VoteEventDTO event) {
        // Fetch entities (This requires minimal DB locks since it runs async on a single thread)
        Poll poll = pollRepository.findById(event.getPollId()).orElse(null);
        User user = userRepository.findById(event.getUserId()).orElse(null);
        
        if (poll == null || user == null) {
            log.error("Poll or User not found for async event: {}", event);
            return; // In valid states, entities should not disappear
        }

        // Validate options
        Option newOption = poll.getOptions().stream()
                .filter(opt -> opt.getId().equals(event.getOptionId()))
                .findFirst().orElse(null);

        if (newOption == null) {
            log.error("Option {} not found in poll {} for event: {}", event.getOptionId(), poll.getId(), event);
            return;
        }

        Optional<Vote> existingVoteOpt = voteRepository.findByUserIdAndPollId(event.getUserId(), event.getPollId());

        if (event.getOldOptionId() != null && existingVoteOpt.isPresent()) {
            // User is changing their vote
            Vote existingVote = existingVoteOpt.get();
            existingVote.setOption(newOption);
            voteRepository.save(existingVote);
            log.debug("Async update: Vote successfully changed to Option {} for user {}", newOption.getId(), user.getId());
        } else if (existingVoteOpt.isEmpty()) {
            // User is casting a brand new vote
            Vote newVote = Vote.builder()
                    .user(user)
                    .poll(poll)
                    .option(newOption)
                    .build();
            voteRepository.save(newVote);
            log.debug("Async save: New vote recorded for Option {} by user {}", newOption.getId(), user.getId());
        } else {
             // In rare sync mismatch (redis thinks new vote, db thinks exist), fallback to update
             Vote existingVote = existingVoteOpt.get();
             existingVote.setOption(newOption);
             voteRepository.save(existingVote);
             log.debug("Async corrective update: Vote modified due to state mismatch for user {}", user.getId());
        }
    }
}
