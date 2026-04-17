package com.xxxx.systemvotting.modules.payment.repository;

import com.xxxx.systemvotting.modules.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTxnRef(String txnRef);
    java.util.List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
