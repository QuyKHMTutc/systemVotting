package com.xxxx.systemvotting.modules.chatbot.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ChatRequestDTO(
        @NotEmpty(message = "Message history cannot be empty")
        @Valid
        List<ChatMessageDTO> messages
) {}
