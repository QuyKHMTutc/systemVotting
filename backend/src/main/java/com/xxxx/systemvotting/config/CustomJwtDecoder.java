package com.xxxx.systemvotting.config;

import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;

/**
 * Custom JWT Decoder with Redis blacklist validation.
 *
 * Uses manual constructor injection with @Qualifier to avoid Spring's
 * ambiguity when multiple RedisTemplate beans exist.
 */
@Component
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${JWT_SECRET_KEY}")
    private String secretKey;

    private NimbusJwtDecoder nimbusJwtDecoder = null;

    private final RedisTokenService redisTokenService;
    // Use Spring Boot's auto-configured StringRedisTemplate — do NOT define a custom one
    // with the same name or BeanDefinitionOverrideException will be thrown on startup.
    private final StringRedisTemplate stringRedisTemplate;

    public CustomJwtDecoder(RedisTokenService redisTokenService, StringRedisTemplate stringRedisTemplate) {
        this.redisTokenService = redisTokenService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

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
            String userIdStr = signedJWT.getJWTClaimsSet().getSubject();
            java.util.Date iat = signedJWT.getJWTClaimsSet().getIssueTime();

            // Check 1: Is the token blacklisted (logged out)?
            // Uses RedisTokenService to ensure key format consistency with @RedisHash("jwt_blocklist")
            if (redisTokenService.existsByJwtId(jwtId)) {
                throw new JwtException("Token is expired");
            }

            // Check 2: Was the token issued before a forced-revoke timestamp (password change)?
            if (userIdStr != null && iat != null) {
                String invalidBeforeStr = stringRedisTemplate.opsForValue()
                        .get("user:jwt:invalid_before:" + userIdStr);
                if (invalidBeforeStr != null) {
                    long invalidBefore = Long.parseLong(invalidBeforeStr);
                    if (iat.getTime() < invalidBefore) {
                        throw new JwtException("Token revoked due to password change");
                    }
                }
            }

        } catch (ParseException e) {
            throw new JwtException("Invalid token format: " + e.getMessage());
        }

        return nimbusJwtDecoder.decode(token);
    }
}
