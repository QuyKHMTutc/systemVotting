package com.xxxx.systemvotting.modules.auth.repository;

import com.xxxx.systemvotting.modules.auth.entity.PasswordResetToken;
import com.xxxx.systemvotting.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByOtp(String otp);

    Optional<PasswordResetToken> findByUser(User user);

    void deleteByUser(User user);
}
