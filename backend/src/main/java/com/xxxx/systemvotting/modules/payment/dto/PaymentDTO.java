package com.xxxx.systemvotting.modules.payment.dto;

import com.xxxx.systemvotting.modules.user.enums.PlanType;
import lombok.Getter;
import lombok.Setter;

public class PaymentDTO {

    @Getter
    @Setter
    public static class PaymentRequest {
        private PlanType planType;
    }

    @Getter
    @Setter
    public static class PaymentResponse {
        private String paymentUrl;
    }

    @Getter
    @Setter
    public static class PaymentHistory {
        private Long id;
        private String txnRef;
        private Long amount;
        private PlanType targetPlan;
        private com.xxxx.systemvotting.modules.payment.enums.TransactionStatus status;
        private java.time.LocalDateTime createdAt;
    }
}
