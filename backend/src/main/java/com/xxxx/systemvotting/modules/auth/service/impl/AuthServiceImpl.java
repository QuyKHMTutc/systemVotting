package com.xxxx.systemvotting.modules.auth.service.impl;

import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.service.AuthService;
import com.xxxx.systemvotting.modules.auth.service.RefreshTokenService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.security.JwtService;
import com.xxxx.systemvotting.exception.custom.TokenRefreshException;
import com.xxxx.systemvotting.modules.auth.entity.RefreshToken;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final com.xxxx.systemvotting.common.service.BaseRedisService<String, String, String> redisService;

    @Override
    public AuthResponseDTO login(AuthRequestDTO requestDTO) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        requestDTO.getEmail(),
                        requestDTO.getPassword()));

        User user = userRepository.findByEmail(requestDTO.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + requestDTO.getEmail()));

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("id", user.getId());
        extraClaims.put("username", user.getUsername());
        extraClaims.put("email", user.getEmail());
        extraClaims.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

        CustomUserDetails userDetails = new CustomUserDetails(user);

        String jwtToken = jwtService.generateToken(extraClaims, userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return AuthResponseDTO.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    @Override
    public AuthResponseDTO refreshToken(TokenRefreshRequestDTO request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    Map<String, Object> extraClaims = new HashMap<>();
                    extraClaims.put("role", user.getRole().name());
                    extraClaims.put("id", user.getId());
                    extraClaims.put("username", user.getUsername());
                    extraClaims.put("email", user.getEmail());
                    extraClaims.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    String token = jwtService.generateToken(extraClaims, userDetails);
                    return AuthResponseDTO.builder()
                            .accessToken(token)
                            .refreshToken(requestRefreshToken)
                            .build();
                })
                .orElseThrow(() -> new TokenRefreshException("Refresh token is invalid or expired"));
    }

    @Override
    public void logout(String accessToken) {
        String email = jwtService.extractUsername(accessToken);
        userRepository.findByEmail(email).ifPresent(user -> {
            // Delete Refresh Token from DB
            refreshTokenService.deleteByUserId(user.getId());
            
            // Blacklist the Access Token in Redis
            long expirationTime = jwtService.extractClaim(accessToken, claims -> claims.getExpiration().getTime());
            long currentTime = System.currentTimeMillis();
            long ttl = expirationTime - currentTime;

            if (ttl > 0) {
                String blacklistKey = "jwt:blacklist:" + accessToken;
                redisService.setWithExpiration(blacklistKey, "blacklisted", ttl, java.util.concurrent.TimeUnit.MILLISECONDS);
            }
        });
    }
}
