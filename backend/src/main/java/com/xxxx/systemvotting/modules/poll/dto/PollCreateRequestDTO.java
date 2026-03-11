package com.xxxx.systemvotting.modules.poll.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollCreateRequestDTO {
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    private String description;

    @NotBlank(message = "Topic is required")
    private String topic;

    @FutureOrPresent(message = "Start time cannot be in the past")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @NotNull(message = "Options are required")
    @Size(min = 2, message = "A poll must have at least 2 options")
    @Valid
    private List<OptionRequestDTO> options;

    private Long creatorId; // Will be set by AuthenticationPrincipal
}
