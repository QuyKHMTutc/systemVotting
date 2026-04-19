package com.xxxx.systemvotting.modules.auth.service.impl;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.TokenDetails;
import com.xxxx.systemvotting.modules.auth.entity.RedisToken;
import com.xxxx.systemvotting.modules.auth.service.JwtService;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisTokenService redisTokenService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void refreshToken_shouldRejectAccessToken() throws Exception {
        TokenRefreshRequestDTO request = new TokenRefreshRequestDTO("access-token");
        SignedJWT signedJWT = org.mockito.Mockito.mock(SignedJWT.class);
        JWTClaimsSet claimsSet = org.mockito.Mockito.mock(JWTClaimsSet.class);

        when(jwtService.validateToken("access-token")).thenReturn(signedJWT);
        when(signedJWT.getJWTClaimsSet()).thenReturn(claimsSet);
        when(claimsSet.getClaim("token_type")).thenReturn("ACCESS_TOKEN");

        assertThrows(AppException.class, () -> authService.refreshToken(request));
        verify(userRepository, never()).findById(any());
    }

    @Test
    void refreshToken_shouldRotateRefreshTokenAndBlacklistOldOne() throws Exception {
        TokenRefreshRequestDTO request = new TokenRefreshRequestDTO("refresh-token");
        SignedJWT signedJWT = org.mockito.Mockito.mock(SignedJWT.class);
        JWTClaimsSet claimsSet = org.mockito.Mockito.mock(JWTClaimsSet.class);
        Date issueTime = new Date();
        Date expirationTime = Date.from(Instant.now().plus(10, ChronoUnit.MINUTES));
        User user = User.builder()
                .id(7L)
                .email("user@example.com")
                .username("tester")
                .role(Role.USER)
                .isVerified(true)
                .locked(false)
                .build();

        when(jwtService.validateToken("refresh-token")).thenReturn(signedJWT);
        when(signedJWT.getJWTClaimsSet()).thenReturn(claimsSet);
        when(claimsSet.getClaim("token_type")).thenReturn("REFRESH_TOKEN");
        when(claimsSet.getJWTID()).thenReturn("old-jti");
        when(claimsSet.getSubject()).thenReturn("7");
        when(claimsSet.getIssueTime()).thenReturn(issueTime);
        when(claimsSet.getExpirationTime()).thenReturn(expirationTime);
        when(redisTokenService.existsByJwtId("old-jti")).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("user:jwt:invalid_before:7")).thenReturn(null);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(eq(user), eq(Set.of("USER")))).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken("7"))
                .thenReturn(TokenDetails.builder().value("new-refresh-token").jwtId("new-jti").ttlSeconds(1200).build());

        AuthResponseDTO response = authService.refreshToken(request);

        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());

        ArgumentCaptor<RedisToken> captor = ArgumentCaptor.forClass(RedisToken.class);
        verify(redisTokenService).saveToken(captor.capture());
        RedisToken blacklistedToken = captor.getValue();
        assertEquals("old-jti", blacklistedToken.getJwtId());
        assertEquals(7L, blacklistedToken.getUserId());
        assertNotNull(blacklistedToken.getExpiration());
    }
}
