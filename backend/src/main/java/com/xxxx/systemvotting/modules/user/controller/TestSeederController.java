package com.xxxx.systemvotting.modules.user.controller;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestSeederController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/seed-users")
    public String seedUsers(@RequestParam(defaultValue = "1000") int count) {
        String basePassword = "123456";
        // Chỉ băm mật khẩu 1 lần giúp tối ưu tốc độ sinh data
        String encodedPassword = passwordEncoder.encode(basePassword);
        List<User> usersToSave = new ArrayList<>();

        try (FileWriter writer = new FileWriter("jmeter_users.csv")) {
            // Không ghi Header để JMeter đọc thẳng vào ${email} và ${password}

            for (int i = 1; i <= count; i++) {
                String username = "user" + i;
                String email = "user" + i + "@gmail.com";

                User user = User.builder()
                        .username(username)
                        .email(email)
                        .password(encodedPassword)
                        .role(Role.USER)
                        .isVerified(true)
                        .locked(false)
                        .build();

                usersToSave.add(user);

                // Ghi vào file CSV: email,password
                writer.write(email + "," + basePassword + "\n");
            }

            // Lưu tất cả vào Database cùng lúc
            userRepository.saveAll(usersToSave);

            return "Thành công: Đã tạo " + count
                    + " users vào Database. File 'jmeter_users.csv' đã được xuất ra nằm trong thư mục backend của project.";
        } catch (IOException e) {
            return "Lỗi khi ghi file CSV: " + e.getMessage();
        }
    }
}
