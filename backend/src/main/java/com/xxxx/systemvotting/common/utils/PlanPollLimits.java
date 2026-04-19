package com.xxxx.systemvotting.common.utils;

import com.xxxx.systemvotting.modules.user.enums.PlanType;

/**
 * Max concurrent polls ("phòng") a creator may own per subscription tier.
 * {@code null} means unlimited.
 */
public final class PlanPollLimits {

    private PlanPollLimits() {}

    public static Integer maxRooms(PlanType plan) {
        PlanType p = plan != null ? plan : PlanType.FREE;
        return switch (p) {
            case FREE -> 5;
            case GO -> 20;
            case PLUS -> 50;
            case PRO -> null;
        };
    }
}
