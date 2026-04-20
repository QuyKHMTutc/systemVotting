package com.xxxx.systemvotting.modules.user.service;

import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;

import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponseDTO createUser(UserCreateRequestDTO requestDTO);

    UserResponseDTO getUserById(Long id);

    PageResponse<UserResponseDTO> getAllUsers(int page, int size);

    UserResponseDTO promoteToAdmin(Long id);

    UserResponseDTO toggleLock(Long id);

    UserResponseDTO updateProfile(Long userId, UserProfileUpdateRequestDTO requestDTO, MultipartFile avatarFile);

    void verifyRegistrationOtp(String email, String otp);

    void resendRegistrationOtp(String email);

    void changePassword(Long userId, com.xxxx.systemvotting.modules.user.dto.ChangePasswordRequestDTO requestDTO);
}
