package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin danh mục")
public class CategoryDTO {

    @Schema(description = "ID danh mục", example = "1")
    private Long id;

    @Schema(description = "Tên danh mục", example = "Công nghệ")
    private String name;

    @Schema(description = "Slug URL-friendly", example = "cong-nghe")
    private String slug;

    @Schema(description = "Emoji icon", example = "💻")
    private String icon;

    @Schema(description = "Thứ tự hiển thị", example = "1")
    private Integer sortOrder;

    @Schema(description = "Số lượng poll trong danh mục", example = "10")
    private Long pollCount;
}
