package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Thông tin lựa chọn và kết quả vote")
public class OptionResponseDTO {
    @Schema(description = "ID của lựa chọn", example = "1")
    private Long id;

    @Schema(description = "Nội dung lựa chọn", example = "Java")
    private String text;

    @Schema(description = "Số lượng bình chọn cho lựa chọn này", example = "10")
    private Integer voteCount;
}
