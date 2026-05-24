package com.xxxx.systemvotting.modules.chatbot.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.chatbot.dto.request.ChatRequestDTO;
import com.xxxx.systemvotting.modules.chatbot.dto.response.ChatResponseDTO;
import com.xxxx.systemvotting.modules.chatbot.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Chatbot CSKH", description = "API cho Chatbot Hỗ trợ Khách hàng (dựa trên AI)")
@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @Operation(summary = "Chat với hệ thống", description = "Gửi lịch sử tin nhắn và nhận phản hồi từ Chatbot AI")
    @PostMapping("/chat")
    public ApiResponse<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO request) {
        ChatResponseDTO response = chatbotService.chat(request);
        return ApiResponse.<ChatResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(response)
                .build();
    }
}
