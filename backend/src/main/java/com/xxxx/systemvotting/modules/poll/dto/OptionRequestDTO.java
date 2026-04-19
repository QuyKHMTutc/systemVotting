package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Thông tin lựa chọn trong bình chọn")
public record OptionRequestDTO(

    @Schema(description = "Nội dung lựa chọn", example = "Java")
    @NotBlank(message = "Option text cannot be empty")
    String text

) {}
