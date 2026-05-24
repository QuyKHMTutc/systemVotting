package com.xxxx.systemvotting.modules.chatbot.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageDTO(
        @NotBlank(message = "Role is required (user or model)")
        String role,
        
        @NotBlank(message = "Content is required")
        String content
) {}
