package com.xxxx.systemvotting.common.util;

import com.xxxx.systemvotting.common.enums.ModerationStatus;

public final class ModerationDecisions {
    private ModerationDecisions() {}

    public static ModerationStatus fromLabel(String label, boolean blocked, boolean available) {
        if (!available) {
            return ModerationStatus.APPROVED;
        }
        if (blocked) {
            return ModerationStatus.REJECTED;
        }
        if ("off_topic".equalsIgnoreCase(label)) {
            return ModerationStatus.REJECTED;
        }
        return ModerationStatus.APPROVED;
    }
}
