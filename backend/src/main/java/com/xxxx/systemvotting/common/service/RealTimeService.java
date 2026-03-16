package com.xxxx.systemvotting.common.service;

public interface RealTimeService {

    /**
     * Broadcasts a message to all subscribers of a specific topic/destination.
     *
     * @param destination The destination, typically starts with "/topic/" (e.g. "/topic/votes")
     * @param payload     The payload object to send
     */
    void broadcast(String destination, Object payload);

    /**
     * Sends a private message to a specific user.
     * The Stomp message will be routed to "/user/{username}/{destination}".
     *
     * @param username    The authenticated username of the recipient
     * @param destination The destination without the "/user/{username}" prefix (e.g. "/queue/notifications")
     * @param payload     The payload object to send
     */
    void sendToUser(String username, String destination, Object payload);
}
