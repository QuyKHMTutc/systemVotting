package com.xxxx.systemvotting.modules.auth.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.service.UserService;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ForgotPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ResetPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.VerifyRegistrationRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ResendRegistrationOtpRequestDTO;
import com.xxxx.systemvotting.modules.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

        private final com.xxxx.systemvotting.modules.auth.service.AuthService authService;
        private final UserService userService;
        private final PasswordResetService passwordResetService;
        private final com.xxxx.systemvotting.modules.auth.service.GoogleAuthService googleAuthService;

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
                AuthResponseDTO authResponse = authService.login(requestDTO);
                return ResponseEntity.ok(ApiResponse.success(authResponse));
        }
        
        @PostMapping("/google")
        public ResponseEntity<ApiResponse<AuthResponseDTO>> loginWithGoogle(
                        @Valid @RequestBody com.xxxx.systemvotting.modules.auth.dto.request.GoogleAuthRequestDTO requestDTO) {
                AuthResponseDTO authResponse = googleAuthService.authenticateWithGoogle(requestDTO.getIdToken());
                return ResponseEntity.ok(ApiResponse.success(authResponse));
        }

        @PostMapping("/refreshToken")
        public ResponseEntity<ApiResponse<AuthResponseDTO>> refreshToken(
                        @Valid @RequestBody TokenRefreshRequestDTO request) {
                AuthResponseDTO authResponse = authService.refreshToken(request);
                return ResponseEntity.ok(ApiResponse.success(authResponse));
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

        @PostMapping("/verify-registration")
        public ResponseEntity<ApiResponse<Void>> verifyRegistration(
                        @Valid @RequestBody VerifyRegistrationRequestDTO request) {
                userService.verifyRegistrationOtp(request.getEmail(), request.getOtp());
                return ResponseEntity.ok(ApiResponse.success("Registration verified successfully. You can now log in.", null));
        }

        @PostMapping("/resend-registration-otp")
        public ResponseEntity<ApiResponse<Void>> resendRegistrationOtp(
                        @Valid @RequestBody ResendRegistrationOtpRequestDTO request) {
                userService.resendRegistrationOtp(request.getEmail());
                return ResponseEntity.ok(ApiResponse.success("A new OTP has been sent to your email", null));
        }
}
