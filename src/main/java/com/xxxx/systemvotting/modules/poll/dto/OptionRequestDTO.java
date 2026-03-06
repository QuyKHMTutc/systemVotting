package com.xxxx.systemvotting.modules.poll.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OptionRequestDTO {
    @NotBlank(message = "Option text cannot be empty")
    private String text;
}
