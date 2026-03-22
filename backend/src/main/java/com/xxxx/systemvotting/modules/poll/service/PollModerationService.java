package com.xxxx.systemvotting.modules.poll.service;

import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;

public interface PollModerationService {
    PollModerationResult moderate(PollCreateRequestDTO requestDTO);

    record PollModerationResult(
            boolean blocked,
            String label,
            String field,
            double confidence,
            String reason,
            boolean available
    ) {
        public static PollModerationResult allowed() {
            return new PollModerationResult(false, "normal", null, 0.0, "Poll passed moderation", true);
        }

        public static PollModerationResult unavailable() {
            return new PollModerationResult(false, "unknown", null, 0.0, "poll moderation unavailable", false);
        }
    }
}
