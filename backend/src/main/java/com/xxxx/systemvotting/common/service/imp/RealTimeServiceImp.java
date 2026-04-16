package com.xxxx.systemvotting.common.service.imp;

import com.xxxx.systemvotting.common.service.RealTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealTimeServiceImp implements RealTimeService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void broadcast(String destination, Object payload) {
        messagingTemplate.convertAndSend(destination, payload);
    }

    @Override
    public void sendToUser(String username, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(username, destination, payload);
    }
}
