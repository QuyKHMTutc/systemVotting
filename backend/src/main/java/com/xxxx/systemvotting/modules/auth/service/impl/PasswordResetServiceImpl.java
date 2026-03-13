package com.xxxx.systemvotting.modules.auth.service.impl;

import com.xxxx.systemvotting.common.service.EmailService;
import com.xxxx.systemvotting.exception.custom.BadRequestException;
import com.xxxx.systemvotting.exception.custom.ResourceNotFoundException;
import com.xxxx.systemvotting.modules.auth.entity.PasswordResetToken;
import com.xxxx.systemvotting.modules.auth.repository.PasswordResetTokenRepository;
import com.xxxx.systemvotting.modules.auth.service.PasswordResetService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // Token valid for 10 minutes
    private static final int EXPIRATION_MINUTES = 10;

    @Override
    @Transactional
    public void processForgotPassword(String email) {
        // Do not reveal whether email exists (security: prevents user enumeration)
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.isVerified()) {
            return; // Same success response - do not reveal if email exists or verification status
        }

        // Reuse existing token if present, otherwise create new one
        PasswordResetToken resetToken = tokenRepository.findByUser(user)
                .orElseGet(() -> PasswordResetToken.builder().user(user).build());

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        resetToken.setOtp(otp);
        resetToken.setExpiryDate(Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES));

        tokenRepository.save(resetToken);

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        PasswordResetToken resetToken = tokenRepository.findByUser(user)
                .orElseThrow(() -> new BadRequestException("No OTP requested for this user"));

        if (!resetToken.getOtp().equals(otp)) {
            throw new BadRequestException("Invalid OTP");
        }

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            tokenRepository.delete(resetToken);
            throw new BadRequestException("OTP has expired");
        }

        // OTP Valid - Update password and set user as verified
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerified(true);
        userRepository.save(user);

        // Delete token after successful reset
        tokenRepository.delete(resetToken);
    }
}
