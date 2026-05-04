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
            case FREE -> 5000;
            case GO -> 5000;
            case PLUS -> 5000;
            case PRO -> null;
        };
    }

    public static int maxJudges(PlanType plan) {
        PlanType p = plan != null ? plan : PlanType.FREE;
        return switch (p) {
            case FREE -> 0;
            case GO -> 10;
            case PLUS -> 40;
            case PRO -> 100; // 100 giám khảo
        };
    }

    public static int judgeWeight(PlanType plan) {
        PlanType p = plan != null ? plan : PlanType.FREE;
        return switch (p) {
            case FREE -> 0;
            case GO -> 50;
            case PLUS -> 60;
            case PRO -> 70;
        };
    }
}
