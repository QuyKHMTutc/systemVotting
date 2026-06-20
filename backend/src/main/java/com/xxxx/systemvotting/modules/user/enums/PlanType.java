package com.xxxx.systemvotting.modules.user.enums;

public enum PlanType {
    FREE(2),
    GO(300),
    PLUS(1000),
    PRO(2000); // 2000 indicates unlimited limit in current logic

    private final int voteLimit;

    PlanType(int voteLimit) {
        this.voteLimit = voteLimit;
    }

    public int getVoteLimit() {
        return voteLimit;
    }
}
