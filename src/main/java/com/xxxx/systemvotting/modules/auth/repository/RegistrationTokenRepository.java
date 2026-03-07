package com.xxxx.systemvotting.modules.auth.repository;

import com.xxxx.systemvotting.modules.auth.entity.RegistrationToken;
import com.xxxx.systemvotting.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistrationTokenRepository extends JpaRepository<RegistrationToken, Long> {
    Optional<RegistrationToken> findByUser(User user);
    Optional<RegistrationToken> findByOtp(String otp);
}
