package com.xxxx.systemvotting.modules.auth.service.impl;

import com.xxxx.systemvotting.modules.auth.entity.RedisToken;
import com.xxxx.systemvotting.modules.auth.repository.RedisTokenRepository;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisTokenServiceImpl implements RedisTokenService {
    private final RedisTokenRepository redisTokenRepository;

    @Override
    public void saveToken(RedisToken token) {
        redisTokenRepository.save(token);
    }

    @Override
    public void deleteTokenByJwtId(String jwtId) {
        redisTokenRepository.findById(jwtId)
                .ifPresent(redisTokenRepository::delete);
    }

    @Override
    public boolean existsByJwtId(String jwtId) {
        return redisTokenRepository.existsById(jwtId);
    }
}
