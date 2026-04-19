package com.xxxx.systemvotting.modules.auth.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.service.AuthService;
import com.xxxx.systemvotting.modules.auth.service.GoogleAuthService;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.service.UserService;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ForgotPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ResetPasswordRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.VerifyRegistrationRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.ResendRegistrationOtpRequestDTO;
import com.xxxx.systemvotting.modules.auth.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.CookieValue;
import jakarta.servlet.http.HttpServletResponse;

@Tag(name = "Auth", description = "Đăng ký, đăng nhập, refresh token, quên mật khẩu, xác thực OTP")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthService authService;
        private final UserService userService;
        private final PasswordResetService passwordResetService;
        private final GoogleAuthService googleAuthService;

        private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
                ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                        .httpOnly(true)
                        .secure(true) // Required for SameSite=None
                        .path("/")
                        .maxAge(7 * 24 * 60 * 60) // 7 days
                        .sameSite("None")
                        .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        private void clearRefreshTokenCookie(HttpServletResponse response) {
                ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                        .httpOnly(true)
                        .secure(true)
                        .path("/")
                        .maxAge(0)
                        .sameSite("None")
                        .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        @Operation(summary = "Đăng ký tài khoản", description = "Tạo tài khoản mới, hệ thống gửi OTP qua email để xác thực")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Đăng ký thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ") })
        @PostMapping("/register")
        public ApiResponse<UserResponseDTO> register(
                        @Valid @RequestBody UserCreateRequestDTO requestDTO) {
                UserResponseDTO createdUser = userService.createUser(requestDTO);
                return ApiResponse.<UserResponseDTO>builder()
                                .code(HttpStatus.CREATED.value())
                                .message("User registered successfully")
                                .data(createdUser)
                                .build();
        }

        @Operation(summary = "Đăng nhập", description = "Đăng nhập bằng email và mật khẩu, trả về access token và refresh token")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng nhập thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Sai email hoặc mật khẩu") })
        @PostMapping("/login")
        public ApiResponse<AuthResponseDTO> login(
                        @Valid @RequestBody AuthRequestDTO requestDTO, 
                        HttpServletResponse response) {
                AuthResponseDTO authResponse = authService.login(requestDTO);
                addRefreshTokenCookie(response, authResponse.refreshToken());
                return ApiResponse.<AuthResponseDTO>builder()
                                .code(HttpStatus.OK.value())
                                .message("Success")
                                .data(authResponse)
                                .build();
        }

        @Operation(summary = "Đăng nhập Google", description = "Đăng nhập bằng Google ID token (OAuth2)")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng nhập thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Token không hợp lệ") })
        @PostMapping("/google")
        public ApiResponse<AuthResponseDTO> loginWithGoogle(
                        @Valid @RequestBody com.xxxx.systemvotting.modules.auth.dto.request.GoogleAuthRequestDTO requestDTO,
                        HttpServletResponse response) {
                AuthResponseDTO authResponse = googleAuthService.authenticateWithGoogle(requestDTO.idToken());
                addRefreshTokenCookie(response, authResponse.refreshToken());
                return ApiResponse.<AuthResponseDTO>builder()
                                .code(HttpStatus.OK.value())
                                .message("Success")
                                .data(authResponse)
                                .build();
        }

        @Operation(summary = "Làm mới token", description = "Dùng refresh token để lấy access token mới")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token mới trả về thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Refresh token hết hạn hoặc không hợp lệ") })
        @PostMapping("/refreshToken")
        public ApiResponse<AuthResponseDTO> refreshToken(
                        @CookieValue(name = "refreshToken", required = false) String refreshToken,
                        HttpServletResponse response) {
                if (refreshToken == null) {
                        throw new com.xxxx.systemvotting.exception.AppException(com.xxxx.systemvotting.exception.ErrorCode.UNAUTHORIZED);
                }
                TokenRefreshRequestDTO request = new TokenRefreshRequestDTO(refreshToken);
                AuthResponseDTO authResponse = authService.refreshToken(request);
                addRefreshTokenCookie(response, authResponse.refreshToken());
                return ApiResponse.<AuthResponseDTO>builder()
                                .code(HttpStatus.OK.value())
                                .message("Success")
                                .data(authResponse)
                                .build();
        }

        @Operation(summary = "Quên mật khẩu", description = "Gửi OTP đặt lại mật khẩu về email")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP đã gửi"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email không tồn tại hoặc không hợp lệ") })
        @PostMapping("/forgot-password")
        public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
                passwordResetService.processForgotPassword(request.email());
                return ApiResponse.<Void>builder()
                                .code(HttpStatus.OK.value())
                                .message("OTP sent to your email successfully")
                                .data(null)
                                .build();
        }

        @Operation(summary = "Đặt lại mật khẩu", description = "Xác thực OTP và cập nhật mật khẩu mới")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "OTP sai hoặc hết hạn") })
        @PostMapping("/reset-password")
        public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
                passwordResetService.resetPassword(request.email(), request.otp(), request.newPassword());
                return ApiResponse.<Void>builder()
                                .code(HttpStatus.OK.value())
                                .message("Password reset successfully")
                                .data(null)
                                .build();
        }

        @Operation(summary = "Xác thực đăng ký", description = "Xác thực OTP sau khi đăng ký để kích hoạt tài khoản")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xác thực thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "OTP sai hoặc hết hạn") })
        @PostMapping("/verify-registration")
        public ApiResponse<Void> verifyRegistration(
                        @Valid @RequestBody VerifyRegistrationRequestDTO request) {
                userService.verifyRegistrationOtp(request.email(), request.otp());
                return ApiResponse.<Void>builder()
                                .code(HttpStatus.OK.value())
                                .message("Registration verified successfully. You can now log in.")
                                .data(null)
                                .build();
        }

        @Operation(summary = "Gửi lại OTP đăng ký", description = "Gửi lại mã OTP xác thực đăng ký qua email")
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP mới đã gửi"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email không tồn tại hoặc đã xác thực") })
        @PostMapping("/resend-registration-otp")
        public ApiResponse<Void> resendRegistrationOtp(
                        @Valid @RequestBody ResendRegistrationOtpRequestDTO request) {
                userService.resendRegistrationOtp(request.email());
                return ApiResponse.<Void>builder()
                                .code(HttpStatus.OK.value())
                                .message("A new OTP has been sent to your email")
                                .data(null)
                                .build();
        }

        @Operation(summary = "Đăng xuất", description = "Hủy token truy cập và refresh token hiện tại", security = {
                        @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication") })
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng xuất thành công") })
        @PostMapping("/logout")
        public ApiResponse<Void> logout(jakarta.servlet.http.HttpServletRequest request,
                        HttpServletResponse response,
                        @CookieValue(name = "refreshToken", required = false) String refreshToken) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String jwt = authHeader.substring(7);
                        authService.logout(jwt, refreshToken);
                }
                clearRefreshTokenCookie(response);
                return ApiResponse.<Void>builder()
                                .code(HttpStatus.OK.value())
                                .message("Logged out successfully")
                                .data(null)
                                .build();
        }
        @Operation(summary = "Lấy thông tin profile", description = "Lấy thông tin người dùng hiện tại", security = {
                        @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication") })
        @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy thông tin thành công") })
        @GetMapping("/me")
        public ApiResponse<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
                UserResponseDTO user = userService.getUserById(Long.valueOf(jwt.getSubject()));
                return ApiResponse.<UserResponseDTO>builder()
                                .code(HttpStatus.OK.value())
                                .message("Success")
                                .data(user)
                                .build();
        }
}
