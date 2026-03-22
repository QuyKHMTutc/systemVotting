package com.xxxx.systemvotting.modules.comment.service;

public interface CommentModerationService {
    ModerationResult moderate(String text);

    record ModerationResult(
            String label,
            boolean blocked,
            String reason,
            double confidence,
            boolean available
    ) {
        public static ModerationResult unavailable() {
            return new ModerationResult("unknown", false, "moderation unavailable", 0.0, false);
        }
    }
}
