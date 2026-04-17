package com.xxxx.systemvotting.modules.payment.service;

import com.xxxx.systemvotting.modules.payment.config.VnPayConfig;
import com.xxxx.systemvotting.modules.payment.entity.PaymentTransaction;
import com.xxxx.systemvotting.modules.payment.enums.TransactionStatus;
import com.xxxx.systemvotting.modules.payment.repository.PaymentTransactionRepository;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.PlanType;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.CacheManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    @Value("${vnpay.tmnCode}")
    private String vnpTmnCode;
    
    @Value("${vnpay.hashSecret}")
    private String vnpHashSecret;

    @Value("${vnpay.payUrl}")
    private String vnpPayUrl;

    @Value("${vnpay.returnUrl}")
    private String vnpReturnUrl;

    public String createPaymentUrl(User user, PlanType planType, HttpServletRequest request) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String orderType = "other";
        long amount = 0;
        
        if (planType == PlanType.GO) {
            amount = 50000;
        } else if (planType == PlanType.PLUS) {
            amount = 200000;
        } else if (planType == PlanType.PRO) {
            amount = 500000;
        } else {
            throw new IllegalArgumentException("Cannot purchase FREE plan");
        }

        long amountVND = amount * 100; // VNPay format
        
        String vnp_TxnRef = VnPayConfig.getRandomNumber(8);
        String vnp_IpAddr = VnPayConfig.getIpAddress(request);
        if (vnp_IpAddr == null || vnp_IpAddr.contains(":")) {
            vnp_IpAddr = "127.0.0.1"; // VNPay requires IPv4 format, avoid IPv6
        }

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnpTmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountVND));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Upgrade_to_" + planType.name() + "_user_" + user.getId());
        vnp_Params.put("vnp_OrderType", orderType);
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnpReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        TimeZone tz = TimeZone.getTimeZone("GMT+7");
        Calendar cld = Calendar.getInstance(tz);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(tz);
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        
        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Save transaction
        PaymentTransaction txn = PaymentTransaction.builder()
                .user(user)
                .txnRef(vnp_TxnRef)
                .amount(amount)
                .orderInfo(vnp_Params.get("vnp_OrderInfo"))
                .targetPlan(planType)
                .status(TransactionStatus.PENDING)
                .build();
        paymentTransactionRepository.save(txn);

        // Build hash data
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                try {
                    //Build hash data
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    //Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
        
        String vnp_SecureHash = VnPayConfig.hmacSHA512(vnpHashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        
        return vnpPayUrl + "?" + query.toString();
    }

    @Transactional
    public int processIPN(Map<String, String> params) {
        
        // Remove secure hash to rebuild hash
        String vnp_SecureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                try {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        String signValue = VnPayConfig.hmacSHA512(vnpHashSecret, hashData.toString());
        if (!signValue.equals(vnp_SecureHash)) {
            return -1; // Invalid signature
        }

        String vnp_TxnRef = params.get("vnp_TxnRef");
        String vnp_ResponseCode = params.get("vnp_ResponseCode");

        Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByTxnRef(vnp_TxnRef);
        if (txnOpt.isEmpty()) {
            return 0; // Order Not Found
        }

        PaymentTransaction txn = txnOpt.get();
        if (txn.getStatus() != TransactionStatus.PENDING) {
            return 2; // Order already confirmed
        }

        if ("00".equals(vnp_ResponseCode)) {
            // Success
            txn.setStatus(TransactionStatus.SUCCESS);
            User user = txn.getUser();
            user.setPlan(txn.getTargetPlan());
            
            // Set expiration date logic
            if (txn.getTargetPlan() == PlanType.GO) {
                user.setPlanExpirationDate(LocalDateTime.now().plusDays(30));
            } else if (txn.getTargetPlan() == PlanType.PLUS) {
                user.setPlanExpirationDate(LocalDateTime.now().plusDays(30));
            } else if (txn.getTargetPlan() == PlanType.PRO) {
                user.setPlanExpirationDate(LocalDateTime.now().plusDays(30));
            }

            userRepository.save(user);
            
            // Evict cache so the frontend can fetch the updated plan
            if (cacheManager.getCache("users") != null) {
                cacheManager.getCache("users").evict(user.getId());
            }
        } else {
            // Failed
            txn.setStatus(TransactionStatus.FAILED);
        }

        paymentTransactionRepository.save(txn);
        return 1; // Success
    }

    @Transactional(readOnly = true)
    public List<com.xxxx.systemvotting.modules.payment.dto.PaymentDTO.PaymentHistory> getPaymentHistory(Long userId) {
        return paymentTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(txn -> {
                com.xxxx.systemvotting.modules.payment.dto.PaymentDTO.PaymentHistory dto = new com.xxxx.systemvotting.modules.payment.dto.PaymentDTO.PaymentHistory();
                dto.setId(txn.getId());
                dto.setTxnRef(txn.getTxnRef());
                dto.setAmount(txn.getAmount());
                dto.setTargetPlan(txn.getTargetPlan());
                dto.setStatus(txn.getStatus());
                dto.setCreatedAt(txn.getCreatedAt());
                dto.setExpiresAt(txn.getCreatedAt() != null ? txn.getCreatedAt().plusDays(30) : null);
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());
    }
}
