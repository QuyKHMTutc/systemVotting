package com.xxxx.systemvotting.modules.user.service;

import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;

import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    UserResponseDTO createUser(UserCreateRequestDTO requestDTO);

    UserResponseDTO getUserById(Long id);

    List<UserResponseDTO> getAllUsers();

    UserResponseDTO promoteToAdmin(Long id);

    UserResponseDTO toggleLock(Long id);

    UserResponseDTO updateProfile(Long userId, UserProfileUpdateRequestDTO requestDTO, MultipartFile avatarFile);

    void verifyRegistrationOtp(String email, String otp);

    void resendRegistrationOtp(String email);
}
