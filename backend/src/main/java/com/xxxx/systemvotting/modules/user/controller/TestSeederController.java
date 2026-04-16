package com.xxxx.systemvotting.modules.user.controller;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Profile({ "dev", "test" })
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestSeederController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/seed-users")
    public String seedUsers(@RequestParam(defaultValue = "10000") int count) {
        // Lấy danh sách các email test đã tồn tại để tránh tạo trùng lặp
        List<User> allUsers = userRepository.findAll();
        Set<String> existingEmails = new HashSet<>();
        for (User u : allUsers) {
            existingEmails.add(u.getEmail());
        }

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

                if (!existingEmails.contains(email)) {
                    usersToSave.add(user);
                }

                // Luôn luôn ghi vào file CSV để cấp cho JMeter
                writer.write(email + "," + basePassword + "\n");
            }

            // Lưu vào DB những user CHƯA TỒN TẠI
            if (!usersToSave.isEmpty()) {
                userRepository.saveAll(usersToSave);
            }

            return "Thành công: Đã kiểm tra " + count 
                    + " users. Có " + usersToSave.size() + " user mới được thêm. Cập nhật lại File 'jmeter_users.csv'.";
        } catch (IOException e) {
            return "Lỗi khi ghi file CSV: " + e.getMessage();
        }
    }

    @GetMapping("/clean-test-data")
    public String cleanTestData() {
        try {
            List<User> allUsers = userRepository.findAll();
            List<User> toFix = new ArrayList<>();
            for (User u : allUsers) {
                if (u.getEmail() != null && u.getEmail().startsWith("user") && u.getEmail().endsWith("@gmail.com") && u.getRole() == Role.USER) {
                    u.setEmail(u.getEmail() + "_old_" + u.getId());
                    u.setUsername(u.getUsername() + "_old_" + u.getId());
                    toFix.add(u);
                }
            }
            userRepository.saveAll(toFix);
            return "Không cần xóa dữ liệu DB! Đã đổi tên tât cả " + toFix.size() + " user test cũ rích thành chuỗi rác để tránh lỗi Duplicate. Bạn có thể gọi lại seed-users thoải mái!";
        } catch (Exception e) {
            return "Lỗi rọn rác: " + e.getMessage();
        }
    }
}
