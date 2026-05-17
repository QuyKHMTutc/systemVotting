package com.xxxx.systemvotting.modules.payment.repository;

import com.xxxx.systemvotting.modules.payment.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTxnRef(String txnRef);
    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PaymentTransaction p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.txnRef) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.user.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PaymentTransaction> searchAllByOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentTransaction p WHERE p.status = :status")
    long sumAmountByStatus(@org.springframework.data.repository.query.Param("status") com.xxxx.systemvotting.modules.payment.enums.TransactionStatus status);
}
