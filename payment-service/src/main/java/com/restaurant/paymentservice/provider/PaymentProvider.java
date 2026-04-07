package com.restaurant.paymentservice.provider;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public interface PaymentProvider {
    String method();

    Map<String, Object> createPayment(String transactionRef, BigDecimal amount, String description, LocalDateTime expireAt);
}
