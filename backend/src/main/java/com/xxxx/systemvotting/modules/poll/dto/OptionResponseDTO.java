package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;

@Schema(description = "Thông tin lựa chọn và kết quả vote")
public record OptionResponseDTO(

    @Schema(description = "ID của lựa chọn", example = "1")
    Long id,

    @Schema(description = "Nội dung lựa chọn", example = "Java")
    String text,

    @Schema(description = "Số lượng bình chọn cho lựa chọn này", example = "10")
    Integer voteCount

) implements Serializable {}
