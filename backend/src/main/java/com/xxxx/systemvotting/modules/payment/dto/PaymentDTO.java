package com.xxxx.systemvotting.modules.payment.dto;

import com.xxxx.systemvotting.modules.payment.enums.TransactionStatus;
import com.xxxx.systemvotting.modules.user.enums.PlanType;

import java.time.LocalDateTime;

/**
 * Namespace class grouping payment-related DTOs.
 * All inner types are records — immutable data carriers.
 */
public final class PaymentDTO {

    private PaymentDTO() {}  // not instantiable

    public record PaymentRequest(PlanType planType) {}

    public record PaymentResponse(String paymentUrl) {}

    public record PaymentHistory(
        Long              id,
        String            txnRef,
        Long              amount,
        PlanType          targetPlan,
        TransactionStatus status,
        LocalDateTime     createdAt,
        LocalDateTime     expiresAt
    ) {}

    /** Dùng cho admin xem tất cả giao dịch (có thêm thông tin user) */
    public record AdminPaymentHistory(
        Long              id,
        String            txnRef,
        Long              amount,
        PlanType          targetPlan,
        TransactionStatus status,
        LocalDateTime     createdAt,
        LocalDateTime     expiresAt,
        Long              userId,
        String            username,
        String            email
    ) {}
}
