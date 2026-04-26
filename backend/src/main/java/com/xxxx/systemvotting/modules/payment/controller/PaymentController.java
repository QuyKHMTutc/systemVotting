package com.xxxx.systemvotting.modules.payment.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.payment.dto.PaymentDTO;
import com.xxxx.systemvotting.modules.payment.service.PaymentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import jakarta.annotation.security.RolesAllowed;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Validated
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-url")
    public ApiResponse<PaymentDTO.PaymentResponse> createPayment(
            @RequestBody PaymentDTO.PaymentRequest requestDto,
            HttpServletRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Long userId = Long.valueOf(jwt.getSubject());
        String paymentUrl = paymentService.createPaymentUrl(userId, requestDto.planType(), request);
        return ApiResponse.<PaymentDTO.PaymentResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(new PaymentDTO.PaymentResponse(paymentUrl))
                .build();
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
    public ApiResponse<PageResponse<PaymentDTO.PaymentHistory>> getPaymentHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Long userId = Long.valueOf(jwt.getSubject());
        PageResponse<PaymentDTO.PaymentHistory> history = paymentService.getPaymentHistory(userId, page, size);
        return ApiResponse.<PageResponse<PaymentDTO.PaymentHistory>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(history)
                .build();
    }

    /** Admin: xem toàn bộ giao dịch của hệ thống */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<PaymentDTO.AdminPaymentHistory>> getAllPayments(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
        PageResponse<PaymentDTO.AdminPaymentHistory> result = paymentService.getAllPayments(page, size);
        return ApiResponse.<PageResponse<PaymentDTO.AdminPaymentHistory>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(result)
                .build();
    }
}
