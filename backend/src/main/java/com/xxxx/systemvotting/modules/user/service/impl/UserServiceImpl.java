package com.xxxx.systemvotting.modules.user.service.impl;

import com.xxxx.systemvotting.modules.user.dto.ChangePasswordRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserCreateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserProfileUpdateRequestDTO;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.mapper.UserMapper;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import com.xxxx.systemvotting.modules.user.service.UserService;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.common.service.imp.FileStorageService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.common.service.imp.EmailService;

import java.util.Random;
import java.util.concurrent.TimeUnit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    private static final int OTP_EXPIRATION_MINUTES = 10;
    private static final String REDIS_OTP_PREFIX = "otp:registration:";

    @Override
    @Transactional
    public UserResponseDTO createUser(UserCreateRequestDTO requestDTO) {
        if (userRepository.existsByUsername(requestDTO.username())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }
        if (userRepository.existsByEmail(requestDTO.email())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        User user = userMapper.toEntity(requestDTO);
        user.setPassword(passwordEncoder.encode(requestDTO.password()));

        // Force Role USER, ignore any role passed in request
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);

        // Generate and store OTP in Redis
        String otp = String.format("%06d", new Random().nextInt(999999));
        String redisKey = REDIS_OTP_PREFIX + savedUser.getEmail();
        redisTemplate.opsForValue().set(redisKey, otp);
        redisTemplate.expire(redisKey, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);

        String subject = "Verify your email - SystemVoting";
        String message = "Your OTP for registration is: " + otp + "\nThis code will expire in " + OTP_EXPIRATION_MINUTES + " minutes.";
        emailService.sendSimpleMessage(savedUser.getEmail(), subject, message);

        return userMapper.toDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#id")
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return userMapper.toDto(user);
    }

    private static final int MAX_USER_PAGE_SIZE = 1000;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponseDTO> getAllUsers(int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = Math.min(Math.max(1, size), MAX_USER_PAGE_SIZE);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("id").ascending());
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserResponseDTO> dtos = userMapper.toDtoList(userPage.getContent());
        Page<UserResponseDTO> dtoPage = new PageImpl<>(dtos, pageable, userPage.getTotalElements());
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", key = "#id")
    public UserResponseDTO promoteToAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        user.setRole(Role.ADMIN);
        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", key = "#id")
    public UserResponseDTO toggleLock(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        user.setLocked(!user.isLocked());

        if (user.isLocked()) {
            // Invalidate active sessions (currently no-op without a user-to-token map, can be handled in JwtValidationFilter optionally)
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public UserResponseDTO updateProfile(Long userId, UserProfileUpdateRequestDTO requestDTO,
            MultipartFile avatarFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (requestDTO.getUsername() != null && !requestDTO.getUsername().trim().isEmpty()) {
            String newUsername = requestDTO.getUsername().trim();
            // Check if another user already has this username
            if (!user.getUsername().equals(newUsername) && userRepository.existsByUsername(newUsername)) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
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
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (user.isVerified()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String redisKey = REDIS_OTP_PREFIX + email;
        String storedOtp = redisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (!storedOtp.equals(otp)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        user.setVerified(true);
        userRepository.save(user);
        redisTemplate.delete(redisKey);
    }

    @Override
    @Transactional
    public void resendRegistrationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (user.isVerified()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Generate and store new OTP in Redis
        String newOtp = String.format("%06d", new Random().nextInt(999999));
        String redisKey = REDIS_OTP_PREFIX + email;
        redisTemplate.opsForValue().set(redisKey, newOtp);
        redisTemplate.expire(redisKey, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);

        String subject = "Verify your email - SystemVoting";
        String message = "Your new OTP for registration is: " + newOtp + "\nThis code will expire in " + OTP_EXPIRATION_MINUTES + " minutes.";
        emailService.sendSimpleMessage(user.getEmail(), subject, message);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("User {} changed password successfully", userId);

        // Invalidate active JWT tokens globally across all devices
        String invalidBeforeKey = "user:jwt:invalid_before:" + userId;
        redisTemplate.opsForValue().set(invalidBeforeKey, String.valueOf(System.currentTimeMillis()), 7, TimeUnit.DAYS);
    }
}
