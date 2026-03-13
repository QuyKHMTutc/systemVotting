package com.xxxx.systemvotting.modules.comment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequestDTO {
    @NotNull(message = "Poll ID is required")
    private Long pollId;

    // Optional: if this comment is a reply to another comment
    private Long parentId;

    @NotBlank(message = "Content must not be blank")
    @Size(max = 2000, message = "Content must not exceed 2000 characters")
    private String content;

    private boolean isAnonymous;
}
