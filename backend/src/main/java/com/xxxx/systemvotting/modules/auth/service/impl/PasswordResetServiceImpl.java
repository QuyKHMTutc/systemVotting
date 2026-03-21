package com.xxxx.systemvotting.modules.auth.service.impl;

import com.xxxx.systemvotting.common.service.imp.EmailService;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.auth.service.PasswordResetService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.data.redis.core.RedisTemplate<String, String> redisTemplate;

    // Token valid for 10 minutes
    private static final int EXPIRATION_MINUTES = 10;
    private static final String REDIS_OTP_PREFIX = "otp:password-reset:";

    @Override
    @Transactional
    public void processForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
        if (!user.isVerified()) {
            throw new AppException(ErrorCode.USER_NOT_VERIFIED);
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        // Store in Redis
        String redisKey = REDIS_OTP_PREFIX + email;
        redisTemplate.opsForValue().set(redisKey, otp);
        redisTemplate.expire(redisKey, EXPIRATION_MINUTES, TimeUnit.MINUTES);

        // Send Email
        String subject = "Password Reset Request";
        String message = "Your OTP for password reset is: " + otp + "\nThis code will expire in " + EXPIRATION_MINUTES
                + " minutes.";

        emailService.sendSimpleMessage(user.getEmail(), subject, message);
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        String redisKey = REDIS_OTP_PREFIX + email;
        String storedOtp = redisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (!storedOtp.equals(otp)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // OTP Valid - Update password and set user as verified
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerified(true);
        userRepository.save(user);

        // Invalidate active JWT tokens globally across all devices
        String invalidBeforeKey = "user:jwt:invalid_before:" + user.getId();
        redisTemplate.opsForValue().set(invalidBeforeKey, String.valueOf(System.currentTimeMillis()), 7, TimeUnit.DAYS);

        // Delete OTP after successful reset
        redisTemplate.delete(redisKey);
    }
}
