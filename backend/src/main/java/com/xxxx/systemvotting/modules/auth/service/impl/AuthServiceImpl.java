package com.xxxx.systemvotting.modules.auth.service.impl;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.service.AuthService;
import com.xxxx.systemvotting.modules.auth.service.JwtService;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import com.xxxx.systemvotting.modules.auth.entity.RedisToken;
import com.xxxx.systemvotting.modules.auth.dto.response.TokenDetails;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.modules.auth.enums.TokenType;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTHENTICATION-SERVICE")
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RedisTokenService redisTokenService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Override
    public AuthResponseDTO login(AuthRequestDTO requestDTO) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(requestDTO.email(), requestDTO.password());
        try {
            Authentication authenticate = authenticationManager.authenticate(authenticationToken);

            User user = (User) authenticate.getPrincipal();

            Set<String> roles = Set.of(user.getRole().name());

            String accessToken = jwtService.generateAccessToken(user, roles);
            TokenDetails refreshToken = jwtService.generateRefreshToken(user.getId().toString());

            return AuthResponseDTO.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.value())
                    .build();
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw new AppException(ErrorCode.USER_NOT_VERIFIED);
        } catch (org.springframework.security.authentication.LockedException e) {
            throw new AppException(ErrorCode.USER_LOCKED);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Override
    public AuthResponseDTO refreshToken(TokenRefreshRequestDTO request) {
        try {
            SignedJWT signedJWT = jwtService.validateToken(request.refreshToken());
            Object tokenTypeClaim = signedJWT.getJWTClaimsSet().getClaim("token_type");
            if (tokenTypeClaim == null || !TokenType.REFRESH_TOKEN.name().equals(tokenTypeClaim.toString())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
            if (redisTokenService.existsByJwtId(jwtId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            String userId = signedJWT.getJWTClaimsSet().getSubject();
            java.util.Date iat = signedJWT.getJWTClaimsSet().getIssueTime();

            if (userId != null && iat != null) {
                String invalidBeforeStr = redisTemplate.opsForValue().get("user:jwt:invalid_before:" + userId);
                if (invalidBeforeStr != null) {
                    long invalidBefore = Long.parseLong(invalidBeforeStr);
                    if (iat.getTime() < invalidBefore) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                    }
                }
            }

            User user = userRepository.findById(Long.valueOf(userId))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (user.isLocked()) {
                throw new AppException(ErrorCode.USER_LOCKED);
            }
            if (!user.isVerified()) {
                throw new AppException(ErrorCode.USER_NOT_VERIFIED);
            }

            Set<String> roles = Set.of(user.getRole().name());

            String newAccessToken = jwtService.generateAccessToken(user, roles);
            TokenDetails newRefreshToken = jwtService.generateRefreshToken(user.getId().toString());
            Date refreshExpiration = signedJWT.getJWTClaimsSet().getExpirationTime();
            long refreshTtl = ChronoUnit.SECONDS.between(
                    Instant.now(),
                    refreshExpiration.toInstant());

            if (refreshTtl > 0) {
                redisTokenService.saveToken(
                        RedisToken.builder()
                                .jwtId(jwtId)
                                .userId(Long.valueOf(userId))
                                .expiration(refreshTtl)
                                .build());
            }

            return AuthResponseDTO.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken.value())
                    .build();

        } catch (ParseException | JOSEException e) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        if (accessToken == null) {
            return;
        }

        try {
            SignedJWT signedAccessToken = jwtService.validateToken(accessToken);
            String accessJwtId = signedAccessToken.getJWTClaimsSet().getJWTID();
            String userId = signedAccessToken.getJWTClaimsSet().getSubject();
            Date accessExpiration = signedAccessToken.getJWTClaimsSet().getExpirationTime();

            long ttl = ChronoUnit.SECONDS.between(
                    Instant.now(),
                    accessExpiration.toInstant());

            if (ttl > 0) {
                redisTokenService.saveToken(
                        RedisToken.builder()
                                .jwtId(accessJwtId)
                                .userId(Long.valueOf(userId))
                                .expiration(ttl)
                                .build());
            }

            if (refreshToken != null) {
                try {
                    SignedJWT signedRefreshToken = jwtService.validateToken(refreshToken);
                    String refreshJwtId = signedRefreshToken.getJWTClaimsSet().getJWTID();
                    String refreshUserId = signedRefreshToken.getJWTClaimsSet().getSubject();
                    Date refreshExpiration = signedRefreshToken.getJWTClaimsSet().getExpirationTime();

                    long refreshTtl = ChronoUnit.SECONDS.between(
                            Instant.now(),
                            refreshExpiration.toInstant());

                    if (refreshTtl > 0) {
                        redisTokenService.saveToken(
                                RedisToken.builder()
                                        .jwtId(refreshJwtId)
                                        .userId(Long.valueOf(refreshUserId))
                                        .expiration(refreshTtl)
                                        .build());
                    }
                } catch (Exception e) {
                    // Ignore expired or invalid refresh token
                }
            }
        } catch (Exception e) {
            // Already expired or invalid
        }
    }
}
