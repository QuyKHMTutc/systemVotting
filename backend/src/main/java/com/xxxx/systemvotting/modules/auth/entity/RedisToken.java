package com.xxxx.systemvotting.modules.auth.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

@RedisHash("jwt_blocklist")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RedisToken {
    @Id
    private String jwtId;
    
    private Long userId;
    
    @TimeToLive
    private long expiration;
}
