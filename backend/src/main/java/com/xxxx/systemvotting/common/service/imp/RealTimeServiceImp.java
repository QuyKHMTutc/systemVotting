package com.xxxx.systemvotting.common.service.imp;

import com.xxxx.systemvotting.common.dto.RealTimeMessageDTO;
import com.xxxx.systemvotting.common.service.RealTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealTimeServiceImp implements RealTimeService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic realTimeTopic;

    @Override
    public void broadcast(String destination, Object payload) {
        RealTimeMessageDTO message = RealTimeMessageDTO.builder()
                .destination(destination)
                .payload(payload)
                .build();
        redisTemplate.convertAndSend(realTimeTopic.getTopic(), message);
    }

    @Override
    public void sendToUser(String username, String destination, Object payload) {
        RealTimeMessageDTO message = RealTimeMessageDTO.builder()
                .destination(destination)
                .payload(payload)
                .targetUsername(username)
                .build();
        redisTemplate.convertAndSend(realTimeTopic.getTopic(), message);
    }
}
