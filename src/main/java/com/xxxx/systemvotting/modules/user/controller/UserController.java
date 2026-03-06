package com.xxxx.systemvotting.modules.user.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.service.UserService;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponseDTO>> createUser(
            @Valid @RequestBody UserCreateRequestDTO requestDTO) {
        UserResponseDTO createdUser = userService.createUser(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", createdUser));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequestDTO requestDTO,
            @AuthenticationPrincipal User user) {
        UserResponseDTO updatedUser = userService.updateProfile(user.getId(), requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getUser(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // These endpoints are implicitly protected by SecurityConfig as
    // hasRole("ADMIN")
    @PutMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<UserResponseDTO>> promoteToAdmin(@PathVariable Long id) {
        UserResponseDTO updatedUser = userService.promoteToAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("User promoted to Admin successfully", updatedUser));
    }

    @PutMapping("/{id}/toggle-lock")
    public ResponseEntity<ApiResponse<UserResponseDTO>> toggleLock(@PathVariable Long id) {
        UserResponseDTO updatedUser = userService.toggleLock(id);
        String action = updatedUser.isLocked() ? "locked" : "unlocked";
        return ResponseEntity.ok(ApiResponse.success("User " + action + " successfully", updatedUser));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
