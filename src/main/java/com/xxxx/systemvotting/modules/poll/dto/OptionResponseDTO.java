package com.xxxx.systemvotting.modules.poll.dto;

import lombok.Data;

@Data
public class OptionResponseDTO {
    private Long id;
    private String text;
    private Integer voteCount;
}
