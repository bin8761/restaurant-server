package com.restaurant.paymentservice.provider;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class SepayPaymentProvider implements PaymentProvider {

    private final SepayProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SepayPaymentProvider(SepayProperties properties,
                                RestTemplateBuilder restTemplateBuilder,
                                ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplateBuilder.build();
        this.objectMapper = objectMapper;
    }

    @Override
    public String method() {
        return "sepay";
    }

    @Override
    public Map<String, Object> createPayment(String transactionRef,
                                             BigDecimal amount,
                                             String description,
                                             LocalDateTime expireAt) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            return buildMockResponse(transactionRef, amount, description, expireAt);
        }

        String url = trimSlash(properties.getBaseUrl()) + withLeadingSlash(properties.getCreatePath());
        Map<String, Object> body = new HashMap<>();
        body.put("reference", transactionRef);
        body.put("amount", amount);
        body.put("content", description);
        body.put("description", description);
        body.put("expire_at", expireAt != null ? expireAt.toString() : null);
        body.put("return_url", properties.getReturnUrl());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiKey());

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

        Map<String, Object> parsed = parseResponse(response.getBody());
        Map<String, Object> normalized = new HashMap<>();
        normalized.put("provider_reference", firstNonNull(parsed, "provider_reference", "reference", "transaction_id", "id"));
        normalized.put("transaction_ref", transactionRef);
        normalized.put("amount", amount);
        normalized.put("expire_at", firstNonNull(parsed, "expire_at", "expired_at"));
        normalized.put("qr_content", firstNonNull(parsed, "qr_content", "qr", "qr_data", "qrCode", "content"));
        normalized.put("qr_image_url", firstNonNull(parsed, "qr_image_url", "qr_image", "qrImage", "qr_url"));
        normalized.put("pay_url", firstNonNull(parsed, "pay_url", "payment_url", "checkout_url"));
        normalized.put("raw", parsed);
        return normalized;
    }

    private Map<String, Object> buildMockResponse(String transactionRef,
                                                  BigDecimal amount,
                                                  String description,
                                                  LocalDateTime expireAt) {
        Map<String, Object> response = new HashMap<>();
        response.put("provider_reference", "mock-" + transactionRef);
        response.put("transaction_ref", transactionRef);
        response.put("amount", amount);
        response.put("expire_at", expireAt != null ? expireAt.toString() : null);
        response.put("qr_content", "SEPAY|" + transactionRef + "|" + amount.toPlainString());
        response.put("qr_image_url", null);
        response.put("pay_url", null);
        response.put("raw", Map.of("mock", true, "description", description));
        return response;
    }

    private Map<String, Object> parseResponse(String body) {
        if (body == null || body.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(body, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Could not parse SePay response body, fallback raw string");
            return Map.of("raw_body", body);
        }
    }

    private Object firstNonNull(Map<String, Object> source, String... keys) {
        if (source == null) {
            return null;
        }
        for (String key : keys) {
            if (source.containsKey(key) && source.get(key) != null) {
                return source.get(key);
            }
        }
        return null;
    }

    private String trimSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String withLeadingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.startsWith("/") ? value : "/" + value;
    }
}
