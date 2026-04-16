package com.xxxx.systemvotting.modules.auth.service;

import com.xxxx.systemvotting.modules.auth.entity.RedisToken;

public interface RedisTokenService {
    void saveToken(RedisToken token);

    void deleteTokenByJwtId(String jwtId);

    boolean existsByJwtId(String jwtId);
}
