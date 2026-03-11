package com.xxxx.systemvotting.modules.comment.service.impl;

import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.modules.comment.dto.request.CommentRequestDTO;
import com.xxxx.systemvotting.modules.comment.dto.response.CommentResponseDTO;
import com.xxxx.systemvotting.modules.comment.entity.Comment;
import com.xxxx.systemvotting.modules.comment.repository.CommentRepository;
import com.xxxx.systemvotting.modules.comment.service.CommentService;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import com.xxxx.systemvotting.modules.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;

    @Override
    public CommentResponseDTO createComment(CommentRequestDTO request, User currentUser) {
        Poll poll = pollRepository.findById(request.getPollId())
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + request.getPollId()));

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .poll(poll)
                .user(currentUser)
                .content(request.getContent());

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found with id: " + request.getParentId()));
            // Business rule: To prevent deep nesting, if the parent itself is a reply, we link to the root parent.
            if (parent.getParent() != null) {
                commentBuilder.parent(parent.getParent());
            } else {
                commentBuilder.parent(parent);
            }
        }

        Comment comment = commentBuilder.build();

        comment = commentRepository.save(comment);

        String voteStatus = "Chưa vote";
        Optional<Vote> voteOpt = voteRepository.findByUserIdAndPollId(currentUser.getId(), poll.getId());
        if (voteOpt.isPresent()) {
            voteStatus = "Đã vote: " + voteOpt.get().getOption().getText();
        }

        return mapToDTO(comment, voteStatus);
    }

    @Override
    public List<CommentResponseDTO> getCommentsByPollId(Long pollId) {
        List<Comment> comments = commentRepository.findByPollIdOrderByCreatedAtDesc(pollId);
        
        if (comments.isEmpty()) {
            return List.of();
        }

        List<Vote> votes = voteRepository.findByPollId(pollId);
        Map<Long, String> userVoteMap = votes.stream()
                .collect(Collectors.toMap(
                        v -> v.getUser().getId(),
                        v -> "Đã vote: " + v.getOption().getText(),
                        (existing, replacement) -> existing
                ));

        // Get all comments and map them to DTOs
        List<CommentResponseDTO> allCommentDTOs = comments.stream()
                .map(comment -> {
                    String voteStatus = userVoteMap.getOrDefault(comment.getUser().getId(), "Chưa vote");
                    return mapToDTO(comment, voteStatus);
                })
                .collect(Collectors.toList());

        // Group into hierarchical structure (Parent -> Replies)
        List<CommentResponseDTO> rootComments = allCommentDTOs.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());

        Map<Long, List<CommentResponseDTO>> repliesByParentId = allCommentDTOs.stream()
                .filter(c -> c.getParentId() != null)
                .sorted(Comparator.comparing(CommentResponseDTO::getCreatedAt)) // Sort replies ascending
                .collect(Collectors.groupingBy(CommentResponseDTO::getParentId));

        rootComments.forEach(root -> {
            root.setReplies(repliesByParentId.getOrDefault(root.getId(), List.of()));
        });

        // We only return the root comments (because replies are nested inside them)
        return rootComments;
    }

    private CommentResponseDTO mapToDTO(Comment comment, String voteStatus) {
        return CommentResponseDTO.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .avatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .voteStatus(voteStatus)
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(java.util.List.of()) // Initialize empty mutable list for later modification if needed, or keeping it empty here since we will set it during tree building
                .build();
    }
}
