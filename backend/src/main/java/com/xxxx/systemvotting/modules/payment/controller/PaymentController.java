package com.xxxx.systemvotting.modules.payment.controller;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.payment.dto.PaymentDTO;
import com.xxxx.systemvotting.modules.payment.service.PaymentService;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-url")
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestBody PaymentDTO.PaymentRequest requestDto,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Long userId = Long.valueOf(jwt.getSubject());
        String paymentUrl = paymentService.createPaymentUrl(userId, requestDto.planType(), request);
        return ResponseEntity.ok(Map.of(
                "data", new PaymentDTO.PaymentResponse(paymentUrl),
                "message", "Success"
        ));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<Map<String, Object>> paymentReturn(@RequestParam Map<String, String> params) {
        int result = paymentService.processIPN(params);
        if (result == 1 || result == 2) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Thanh toán thành công"));
        }
        if (result == -1) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Sai chữ ký bảo mật"));
        }
        if (result == 0) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Không tìm thấy hóa đơn"));
        }
        return ResponseEntity.ok(Map.of("success", false, "message", "Lỗi không xác định"));
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> paymentIpn(@RequestParam Map<String, String> params) {
        int result = paymentService.processIPN(params);

        Map<String, String> response = new HashMap<>();

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
    public ResponseEntity<Map<String, Object>> getPaymentHistory(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Long userId = Long.valueOf(jwt.getSubject());
        List<PaymentDTO.PaymentHistory> history = paymentService.getPaymentHistory(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", history));
    }
}
