package com.xxxx.systemvotting.modules.comment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequestDTO {
    private Long pollId;

    // Optional: if this comment is a reply to another comment
    private Long parentId;

    @NotBlank(message = "Content must not be blank")
    private String content;

    private boolean isAnonymous;
}
