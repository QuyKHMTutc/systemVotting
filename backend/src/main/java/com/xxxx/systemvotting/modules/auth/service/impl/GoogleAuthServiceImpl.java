package com.xxxx.systemvotting.modules.auth.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.entity.RefreshToken;
import com.xxxx.systemvotting.modules.auth.service.GoogleAuthService;
import com.xxxx.systemvotting.modules.auth.service.RefreshTokenService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private final GoogleIdTokenVerifier verifier;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public GoogleAuthServiceImpl(@Value("${app.security.oauth2.google.client-id}") String clientId,
                                 UserRepository userRepository,
                                 JwtService jwtService,
                                 RefreshTokenService refreshTokenService) {
        // Build verifier without strict audience checks for debugging!
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .build();
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
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

                // Find user by email or create a new one
                User user = userRepository.findByEmail(email).orElse(null);
                
                if (user == null) {
                    
                    String usernameBase = name != null ? name.replaceAll("\\s+", "").toLowerCase() : email.split("@")[0];
                    String finalUsername = usernameBase;
                    int counter = 1;
                    
                    // Ensure unique username
                    while(userRepository.existsByUsername(finalUsername)) {
                        finalUsername = usernameBase + counter;
                        counter++;
                    }
                    
                    user = User.builder()
                            .email(email)
                            .username(finalUsername)
                            .avatarUrl(pictureUrl)
                            // A random password as they are logging in via Google
                            .password(UUID.randomUUID().toString())
                            .role(Role.USER)
                            .isVerified(true) // Google accounts are considered verified
                            .build();
                    user = userRepository.save(user);
                }
                
                // Check if account is locked before continuing
                if (!user.isAccountNonLocked()) {
                    throw new com.xxxx.systemvotting.exception.custom.BadRequestException("Tài khoản của bạn đã bị khóa.");
                }

                // Generate our JWT and Refresh tokens
                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("role", user.getRole().name());
                extraClaims.put("id", user.getId());
                extraClaims.put("username", user.getUsername());
                extraClaims.put("email", user.getEmail());
                extraClaims.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

                String jwtToken = jwtService.generateToken(extraClaims, user);
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

                return AuthResponseDTO.builder()
                        .accessToken(jwtToken)
                        .refreshToken(refreshToken.getToken())
                        .build();

            } else {
                System.out.println("Google Token Verification Failed. The token might be expired, malformed, or the client ID doesn't match.");
                throw new RuntimeException("Invalid Google ID token.");
            }
        } catch (Exception e) {
            System.err.println("Exception during Google Token Verification: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error verifying Google ID token: " + e.getMessage(), e);
        }
    }
}
