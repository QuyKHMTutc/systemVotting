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

    public static int maxJudges(PlanType plan) {
        PlanType p = plan != null ? plan : PlanType.FREE;
        return switch (p) {
            case FREE -> 5;
            case GO -> 7;
            case PLUS -> 9;
            case PRO -> 11;
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

    public static int maxInvites(PlanType plan) {
        PlanType p = plan != null ? plan : PlanType.FREE;
        return switch (p) {
            case FREE -> 100;
            case GO -> 300;
            case PLUS -> 1000;
            case PRO -> 2000;
        };
    }
}
