package com.xxxx.systemvotting.config;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "USER-INIT-DATA")
public class AppInitialDataConfiguration implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "admin";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .username("admin")
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(ADMIN_PASSWORD))
                    .role(Role.ADMIN)
                    .isVerified(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);
            log.info("SuperAdmin account created: {}", ADMIN_EMAIL);
        } else {
            userRepository.findByEmail(ADMIN_EMAIL).ifPresent(admin -> {
                if (!admin.isVerified()) {
                    admin.setVerified(true);
                    userRepository.save(admin);
                    log.info("SuperAdmin account verification updated: {}", ADMIN_EMAIL);
                }
            });
        }

        log.info("Initial data created successfully");
    }
}
