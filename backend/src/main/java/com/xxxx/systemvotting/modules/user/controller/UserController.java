package com.xxxx.systemvotting.modules.user.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@Tag(name = "Users", description = "Quản lý user: profile, admin (promote, lock), danh sách user")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Tạo user (Admin)", description = "Chỉ ADMIN mới gọi được", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền ADMIN") })
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponseDTO>> createUser(
            @Valid @RequestBody UserCreateRequestDTO requestDTO) {
        UserResponseDTO createdUser = userService.createUser(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", createdUser));
    }

    @Operation(summary = "Cập nhật profile", description = "Cập nhật username, avatar (multipart/form-data)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PutMapping(value = "/me", consumes = { "multipart/form-data" })
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @RequestParam(required = false) String username,
            @RequestPart(value = "avatar", required = false) MultipartFile avatarFile,
            @AuthenticationPrincipal User user) {

        UserProfileUpdateRequestDTO requestDTO = new UserProfileUpdateRequestDTO();
        requestDTO.setUsername(username);

        UserResponseDTO updatedUser = userService.updateProfile(user.getId(), requestDTO, avatarFile);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedUser));
    }

    @Operation(summary = "Chi tiết user theo ID", description = "Lấy thông tin user (Admin)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getUser(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // These endpoints are implicitly protected by SecurityConfig as
    // hasRole("ADMIN")
    @Operation(summary = "Thăng admin", description = "Chỉ ADMIN: thăng user lên vai trò ADMIN", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền") })
    @PutMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<UserResponseDTO>> promoteToAdmin(@PathVariable Long id) {
        UserResponseDTO updatedUser = userService.promoteToAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("User promoted to Admin successfully", updatedUser));
    }

    @Operation(summary = "Khóa / mở khóa user", description = "Chỉ ADMIN: bật/tắt trạng thái khóa tài khoản", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền") })
    @PutMapping("/{id}/toggle-lock")
    public ResponseEntity<ApiResponse<UserResponseDTO>> toggleLock(@PathVariable Long id) {
        UserResponseDTO updatedUser = userService.toggleLock(id);
        String action = updatedUser.isLocked() ? "locked" : "unlocked";
        return ResponseEntity.ok(ApiResponse.success("User " + action + " successfully", updatedUser));
    }

    @Operation(summary = "Danh sách user", description = "Chỉ ADMIN: lấy tất cả user", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
