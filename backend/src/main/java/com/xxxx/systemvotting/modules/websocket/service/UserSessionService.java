package com.xxxx.systemvotting.modules.websocket.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserSessionService {

    // Maps a userId to a set of active sessionIds
    private final ConcurrentHashMap<String, Set<String>> userSessions = new ConcurrentHashMap<>();

    public void saveSession(String userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void removeSession(String userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
    }

    public Set<String> getSessions(String userId) {
        return userSessions.getOrDefault(userId, Set.of());
    }
}
