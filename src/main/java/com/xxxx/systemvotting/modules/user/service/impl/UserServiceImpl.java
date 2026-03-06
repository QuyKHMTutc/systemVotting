package com.xxxx.systemvotting.modules.user.service.impl;

import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.mapper.UserMapper;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.user.service.UserService;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.common.service.FileStorageService;
import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final com.xxxx.systemvotting.modules.auth.repository.RefreshTokenRepository refreshTokenRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public UserResponseDTO createUser(UserCreateRequestDTO requestDTO) {
        if (userRepository.existsByUsername(requestDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(requestDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = userMapper.toEntity(requestDTO);
        user.setPassword(passwordEncoder.encode(requestDTO.getPassword()));

        // Force Role USER, ignore any role passed in request
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        return userMapper.toDtoList(userRepository.findAll());
    }

    @Override
    @Transactional
    public UserResponseDTO promoteToAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setRole(Role.ADMIN);
        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    public UserResponseDTO toggleLock(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setLocked(!user.isLocked());

        if (user.isLocked()) {
            // Invalidate active sessions
            refreshTokenRepository.deleteByUser(user);
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    public UserResponseDTO updateProfile(Long userId, UserProfileUpdateRequestDTO requestDTO,
            MultipartFile avatarFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (requestDTO.getUsername() != null && !requestDTO.getUsername().trim().isEmpty()) {
            String newUsername = requestDTO.getUsername().trim();
            // Check if another user already has this username
            if (!user.getUsername().equals(newUsername) && userRepository.existsByUsername(newUsername)) {
                throw new com.xxxx.systemvotting.exception.custom.DuplicateResourceException("Username already taken");
            }
            user.setUsername(newUsername);
        }

        if (avatarFile != null && !avatarFile.isEmpty()) {
            String avatarUrl = fileStorageService.storeFile(avatarFile);
            user.setAvatarUrl(avatarUrl);
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }
}
