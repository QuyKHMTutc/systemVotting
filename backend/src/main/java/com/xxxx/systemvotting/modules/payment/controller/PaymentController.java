package com.xxxx.systemvotting.modules.payment.controller;

import com.xxxx.systemvotting.modules.payment.config.VnPayConfig;
import com.xxxx.systemvotting.modules.payment.dto.PaymentDTO;
import com.xxxx.systemvotting.modules.payment.service.PaymentService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @PostMapping("/create-url")
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentDTO.PaymentRequest requestDto,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            if (jwt == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }
            Long userId = Long.valueOf(jwt.getSubject());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String paymentUrl = paymentService.createPaymentUrl(user, requestDto.getPlanType(), request);
            
            PaymentDTO.PaymentResponse response = new PaymentDTO.PaymentResponse();
            response.setPaymentUrl(paymentUrl);
            return ResponseEntity.ok(Map.of("data", response, "message", "Success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> paymentReturn(@RequestParam Map<String, String> params) {
        try {
            int result = paymentService.processIPN(params);
            if (result == 1 || result == 2) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Thanh toán thành công"));
            } else if (result == -1) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Sai chữ ký bảo mật"));
            } else if (result == 0) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Không tìm thấy hóa đơn"));
            }
            return ResponseEntity.ok(Map.of("success", false, "message", "Lỗi không xác định"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<?> paymentIpn(@RequestParam Map<String, String> params) {
        int result = paymentService.processIPN(params);
        
        Map<String, String> response = new HashMap<>(); // Do not use Map.of since it's immutable
        
        if (result == 1) {
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } else if (result == 0) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
        } else if (result == 2) {
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
        } else if (result == -1) {
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
        } else {
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }
        Long userId = Long.valueOf(jwt.getSubject());
        java.util.List<PaymentDTO.PaymentHistory> history = paymentService.getPaymentHistory(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", history));
    }
}
