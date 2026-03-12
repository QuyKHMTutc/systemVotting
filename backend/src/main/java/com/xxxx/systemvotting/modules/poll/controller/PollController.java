package com.xxxx.systemvotting.modules.poll.controller;

import java.util.List;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.modules.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/polls")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    @PostMapping
    public ResponseEntity<ApiResponse<PollResponseDTO>> createPoll(
            @Valid @RequestBody PollCreateRequestDTO requestDTO,
            @AuthenticationPrincipal User user) {

        requestDTO.setCreatorId(user.getId());

        PollResponseDTO createdPoll = pollService.createPoll(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Poll created successfully", createdPoll));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PollResponseDTO>> getPoll(@PathVariable("id") Long id) {
        PollResponseDTO poll = pollService.getPollById(id);
        return ResponseEntity.ok(ApiResponse.success(poll));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PollResponseDTO>>> getAllPolls(
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "tag", required = false, defaultValue = "ALL") String tag,
            @RequestParam(name = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "direction", defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PollResponseDTO> polls = pollService.getAllPolls(title, tag, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(polls));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePoll(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        pollService.deletePoll(id, user);
        return ResponseEntity.ok(ApiResponse.success("Poll deleted successfully", null));
    }

    @GetMapping("/my-polls")
    public ResponseEntity<ApiResponse<java.util.List<PollResponseDTO>>> getMyPolls(
            @AuthenticationPrincipal User user) {
        java.util.List<PollResponseDTO> polls = pollService.getMyPolls(user.getId());
        return ResponseEntity.ok(ApiResponse.success(polls));
    }

    @GetMapping("/my-voted")
    public ResponseEntity<ApiResponse<java.util.List<PollResponseDTO>>> getVotedPolls(
            @AuthenticationPrincipal User user) {
        java.util.List<PollResponseDTO> polls = pollService.getVotedPolls(user.getId());
        return ResponseEntity.ok(ApiResponse.success(polls));
    }
}
