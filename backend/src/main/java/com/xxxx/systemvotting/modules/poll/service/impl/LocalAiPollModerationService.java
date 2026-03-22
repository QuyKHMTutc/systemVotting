package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.modules.comment.service.CommentModerationService;
import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.service.PollModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocalAiPollModerationService implements PollModerationService {

    private final CommentModerationService commentModerationService;

    @Value("${app.moderation.poll.enabled:true}")
    private boolean enabled;

    @Override
    public PollModerationResult moderate(PollCreateRequestDTO requestDTO) {
        if (!enabled || requestDTO == null) {
            return PollModerationResult.unavailable();
        }

        PollModerationResult titleResult = moderateField("title", requestDTO.getTitle());
        if (titleResult.blocked()) return titleResult;

        PollModerationResult descriptionResult = moderateField("description", requestDTO.getDescription());
        if (descriptionResult.blocked()) return descriptionResult;

        if (requestDTO.getOptions() != null) {
            for (int i = 0; i < requestDTO.getOptions().size(); i++) {
                OptionRequestDTO option = requestDTO.getOptions().get(i);
                PollModerationResult optionResult = moderateField("option[" + i + "]", option != null ? option.getText() : null);
                if (optionResult.blocked()) return optionResult;
            }
        }

        return PollModerationResult.allowed();
    }

    private PollModerationResult moderateField(String field, String text) {
        if (text == null || text.isBlank()) {
            return PollModerationResult.allowed();
        }

        CommentModerationService.ModerationResult result = commentModerationService.moderate(text.trim());
        if (!result.available()) {
            return PollModerationResult.unavailable();
        }

        if (result.blocked()) {
            return new PollModerationResult(true, result.label(), field, result.confidence(), result.reason(), true);
        }

        return PollModerationResult.allowed();
    }
}
