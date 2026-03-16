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
import com.xxxx.systemvotting.common.service.EmailService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import com.xxxx.systemvotting.common.service.BaseRedisService;
import java.util.Optional;
import com.xxxx.systemvotting.exception.custom.BadRequestException;
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
    private final EmailService emailService;
    private final BaseRedisService<String, String, String> redisService;

    private static final int OTP_EXPIRATION_MINUTES = 10;
    private static final String REDIS_OTP_PREFIX = "otp:registration:";

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

        // Generate and store OTP in Redis
        String otp = String.format("%06d", new Random().nextInt(999999));
        String redisKey = REDIS_OTP_PREFIX + savedUser.getEmail();
        redisService.set(redisKey, otp);
        redisService.setTimeToLive(redisKey, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);

        String subject = "Verify your email - SystemVoting";
        String message = "Your OTP for registration is: " + otp + "\nThis code will expire in " + OTP_EXPIRATION_MINUTES + " minutes.";
        emailService.sendSimpleMessage(savedUser.getEmail(), subject, message);

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

    @Override
    @Transactional
    public void verifyRegistrationOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isVerified()) {
            throw new BadRequestException("User is already verified");
        }

        String redisKey = REDIS_OTP_PREFIX + email;
        String storedOtp = redisService.get(redisKey);

        if (storedOtp == null) {
            throw new BadRequestException("OTP has expired or not requested");
        }

        if (!storedOtp.equals(otp)) {
            throw new BadRequestException("Invalid OTP");
        }

        user.setVerified(true);
        userRepository.save(user);
        redisService.delete(redisKey);
    }

    @Override
    @Transactional
    public void resendRegistrationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isVerified()) {
            throw new BadRequestException("User is already verified");
        }

        // Generate and store new OTP in Redis
        String newOtp = String.format("%06d", new Random().nextInt(999999));
        String redisKey = REDIS_OTP_PREFIX + email;
        redisService.set(redisKey, newOtp);
        redisService.setTimeToLive(redisKey, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);

        String subject = "Verify your email - SystemVoting";
        String message = "Your new OTP for registration is: " + newOtp + "\nThis code will expire in " + OTP_EXPIRATION_MINUTES + " minutes.";
        emailService.sendSimpleMessage(user.getEmail(), subject, message);
    }
}
