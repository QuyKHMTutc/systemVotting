package com.xxxx.systemvotting.modules.poll.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Map;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dữ liệu trục thời gian cho biểu đồ Analytics")
public class TimePointDTO {
    @Schema(description = "Mốc thời gian (vd: 2024-05-24 hoặc 2024-05-24 14:00)", example = "2024-05-24")
    private String time;
    
    @Schema(description = "Map chứa số lượng vote của từng Option ID. Key là Option ID, Value là tổng số vote.")
    private Map<String, Integer> options;
}
