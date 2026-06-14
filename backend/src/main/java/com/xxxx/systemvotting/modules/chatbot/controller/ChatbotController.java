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
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Chatbot CSKH", description = "API cho Chatbot Hỗ trợ Khách hàng (dựa trên AI)")
@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final UserService userService;

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

    @Operation(summary = "Chat (Streaming)", description = "Sử dụng Server-Sent Events (SSE) để nhận phản hồi từ AI theo thời gian thực")
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @Valid @RequestBody ChatRequestDTO request,
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal Jwt jwt) {

        String ipAddress = httpRequest.getRemoteAddr();
        UserResponseDTO user = null;
        if (jwt != null && jwt.getSubject() != null) {
            try {
                user = userService.getUserById(Long.valueOf(jwt.getSubject()));
            } catch (Exception ignored) {
            }
        }
        return chatbotService.chatStream(request, user, ipAddress);
    }
}
