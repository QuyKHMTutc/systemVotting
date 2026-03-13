package com.xxxx.systemvotting.modules.poll.dto;

import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollResponseDTO {
    private Long id;
    private String title;
    private String description;
    private List<String> tags;
    private boolean isAnonymous;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private UserResponseDTO creator;
    private List<OptionResponseDTO> options;
    private int commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
