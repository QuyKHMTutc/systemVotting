package com.xxxx.systemvotting.modules.auth.controller;

import java.util.HashMap;
import java.util.Map;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.service.RefreshTokenService;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.user.service.UserService;
import com.xxxx.systemvotting.security.JwtService;
import com.xxxx.systemvotting.exception.custom.TokenRefreshException;
import com.xxxx.systemvotting.modules.auth.entity.RefreshToken;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ForgotPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ResetPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

        private final UserService userService;
        private final UserRepository userRepository;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final RefreshTokenService refreshTokenService;
        private final PasswordResetService passwordResetService;

        @PostMapping("/register")
        public ResponseEntity<ApiResponse<UserResponseDTO>> register(
                        @Valid @RequestBody UserCreateRequestDTO requestDTO) {
                UserResponseDTO createdUser = userService.createUser(requestDTO);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("User registered successfully", createdUser));
        }

        @PostMapping("/login")
        public ResponseEntity<ApiResponse<AuthResponseDTO>> login(
                        @Valid @RequestBody AuthRequestDTO requestDTO) {

                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                requestDTO.getUsername(),
                                                requestDTO.getPassword()));

                User user = userRepository.findByUsername(requestDTO.getUsername())
                                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("role", user.getRole().name());
                extraClaims.put("id", user.getId());

                String jwtToken = jwtService.generateToken(extraClaims, user);
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

                return ResponseEntity.ok(ApiResponse.success(
                                AuthResponseDTO.builder()
                                                .accessToken(jwtToken)
                                                .refreshToken(refreshToken.getToken())
                                                .build()));
        }

        @PostMapping("/refreshToken")
        public ResponseEntity<ApiResponse<AuthResponseDTO>> refreshToken(
                        @Valid @RequestBody TokenRefreshRequestDTO request) {
                String requestRefreshToken = request.getRefreshToken();

                // This process might be moved to a Service layer function in the future for
                // cleaner code
                // For now, doing it here to be explicit
                return refreshTokenService.findByToken(requestRefreshToken)
                                .map(refreshTokenService::verifyExpiration)
                                .map(RefreshToken::getUser)
                                .map(user -> {
                                        Map<String, Object> extraClaims = new HashMap<>();
                                        extraClaims.put("role", user.getRole().name());
                                        extraClaims.put("id", user.getId());
                                        String token = jwtService.generateToken(extraClaims, user);
                                        return ResponseEntity.ok(ApiResponse.success(
                                                        AuthResponseDTO.builder()
                                                                        .accessToken(token)
                                                                        .refreshToken(requestRefreshToken)
                                                                        .build()));
                                })
                                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                                                "Refresh token is not in database!"));
        }

        @PostMapping("/forgot-password")
        public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
                passwordResetService.processForgotPassword(request.getEmail());
                return ResponseEntity.ok(ApiResponse.success("OTP sent to your email successfully", null));
        }

        @PostMapping("/reset-password")
        public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
                passwordResetService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
                return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
        }
}
