package com.xxxx.systemvotting.config;

import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;

@Component
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${JWT_SECRET_KEY}")
    private String secretKey;

    private NimbusJwtDecoder nimbusJwtDecoder = null;

    private final RedisTokenService redisTokenService;
    private final org.springframework.data.redis.core.RedisTemplate<String, String> redisTemplate;

    @PostConstruct
    public void init() {
        SecretKey key = new SecretKeySpec(secretKey.getBytes(), "HS512");
        nimbusJwtDecoder = NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String jwtId = signedJWT.getJWTClaimsSet().getJWTID();

            if (redisTokenService.existsByJwtId(jwtId))
                throw new JwtException("Token is expired");

            String userIdStr = signedJWT.getJWTClaimsSet().getSubject();
            java.util.Date iat = signedJWT.getJWTClaimsSet().getIssueTime();
            
            if (userIdStr != null && iat != null) {
                String invalidBeforeStr = redisTemplate.opsForValue().get("user:jwt:invalid_before:" + userIdStr);
                if (invalidBeforeStr != null) {
                    long invalidBefore = Long.parseLong(invalidBeforeStr);
                    if (iat.getTime() < invalidBefore) {
                        throw new JwtException("Token revoked due to password change");
                    }
                }
            }

        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        return nimbusJwtDecoder.decode(token);
    }
}
