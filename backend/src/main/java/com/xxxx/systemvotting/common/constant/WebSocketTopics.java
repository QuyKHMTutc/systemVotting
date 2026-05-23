package com.xxxx.systemvotting.common.constant;

public final class WebSocketTopics {

    private WebSocketTopics() {
    }

    public static final String GLOBAL_POLL_EVENTS = "/topic/polls/events";
    public static final String PRIVATE_POLL_EVENTS = "/queue/polls/events";

    public static final String EVENT_TYPE_CREATED = "CREATED";
    public static final String EVENT_TYPE_DELETED = "DELETED";
    public static final String EVENT_TYPE_VOTED = "VOTED";
}
