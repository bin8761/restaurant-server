package com.restaurant.paymentservice.provider;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class CashPaymentProvider implements PaymentProvider {
    @Override
    public String method() {
        return "cash";
    }

    @Override
    public Map<String, Object> createPayment(String transactionRef, BigDecimal amount, String description, LocalDateTime expireAt) {
        Map<String, Object> result = new HashMap<>();
        result.put("transaction_ref", transactionRef);
        result.put("amount", amount);
        result.put("description", description);
        result.put("expire_at", expireAt);
        return result;
    }
}
