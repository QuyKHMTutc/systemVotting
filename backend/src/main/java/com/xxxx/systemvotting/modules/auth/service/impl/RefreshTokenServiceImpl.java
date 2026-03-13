package com.xxxx.systemvotting.modules.auth.service.impl;

import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.exception.custom.TokenRefreshException;
import com.xxxx.systemvotting.modules.auth.entity.RefreshToken;
import com.xxxx.systemvotting.modules.auth.repository.RefreshTokenRepository;
import com.xxxx.systemvotting.modules.auth.service.RefreshTokenService;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${app.security.jwt.refresh-token.expiration:604800000}")
    private Long refreshTokenDurationMs;

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        com.xxxx.systemvotting.modules.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElse(new RefreshToken());

        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException("Refresh token has expired. Please sign in again");
        }
        return token;
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        userRepository.findById(userId).ifPresent(refreshTokenRepository::deleteByUser);
    }
}
