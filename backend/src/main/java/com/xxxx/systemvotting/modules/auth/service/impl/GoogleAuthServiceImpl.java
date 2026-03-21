package com.xxxx.systemvotting.modules.auth.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.TokenDetails;
import com.xxxx.systemvotting.modules.auth.entity.RedisToken;
import com.xxxx.systemvotting.modules.auth.service.GoogleAuthService;
import com.xxxx.systemvotting.modules.auth.service.RedisTokenService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private final GoogleIdTokenVerifier verifier;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RedisTokenService redisTokenService;

    public GoogleAuthServiceImpl(@Value("${app.security.oauth2.google.client-id:default}") String clientId,
                                 UserRepository userRepository,
                                 JwtService jwtService,
                                 RedisTokenService redisTokenService) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.redisTokenService = redisTokenService;
    }

    @Override
    @Transactional
    public AuthResponseDTO authenticateWithGoogle(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");

                User user = userRepository.findByEmail(email).orElse(null);
                
                if (user == null) {
                    String usernameBase = name != null ? name.replaceAll("\\s+", "").toLowerCase() : email.split("@")[0];
                    String finalUsername = usernameBase;
                    int counter = 1;
                    
                    while(userRepository.existsByUsername(finalUsername)) {
                        finalUsername = usernameBase + counter;
                        counter++;
                    }
                    
                    user = User.builder()
                            .email(email)
                            .username(finalUsername)
                            .avatarUrl(pictureUrl)
                            .password(UUID.randomUUID().toString())
                            .role(Role.USER)
                            .isVerified(true)
                            .build();
                    user = userRepository.save(user);
                } else {
                    // If user exists but has no avatar, update it with Google's picture
                    if (user.getAvatarUrl() == null || user.getAvatarUrl().trim().isEmpty()) {
                        if (pictureUrl != null && !pictureUrl.isEmpty()) {
                            user.setAvatarUrl(pictureUrl);
                            user = userRepository.save(user);
                        }
                    }
                }
                
                if (user.isLocked()) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }

                Set<String> roles = Set.of(user.getRole().name());
                String jwtToken = jwtService.generateAccessToken(user, roles);
                TokenDetails refreshToken = jwtService.generateRefreshToken(user.getId().toString());
                
                return AuthResponseDTO.builder()
                        .accessToken(jwtToken)
                        .refreshToken(refreshToken.value())
                        .build();

            } else {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Token Exception: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_ERROR);
        }
    }
}
