package com.xxxx.systemvotting.modules.comment.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommentRequestDTO(

    @NotNull(message = "Poll ID is required")
    Long pollId,

    /** null if this is a top-level comment, non-null if it is a reply */
    Long parentId,

    @NotBlank(message = "Content must not be blank")
    @Size(max = 2000, message = "Content must not exceed 2000 characters")
    String content,

    @JsonProperty("isAnonymous")
    boolean isAnonymous

) {}
