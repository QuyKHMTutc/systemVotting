package com.xxxx.systemvotting.modules.comment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentityStatusDTO {
    private boolean hasCommented;
    private Boolean isAnonymous; // nullable if hasn't commented
}
