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
import java.time.Duration;
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
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("SePay API key is missing. Fallback to mock QR for transactionRef={}", transactionRef);
            return buildMockResponse(transactionRef, amount, description, expireAt);
        }

        String url = resolveCreateUrl();
        boolean userApiMode = isUserApiOrderUrl(url);
        Map<String, Object> body = buildCreateRequestBody(userApiMode, transactionRef, amount, description, expireAt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

        Map<String, Object> parsed = parseResponse(response.getBody());
        Map<String, Object> source = extractPrimaryPayload(parsed);
        Map<String, Object> normalized = new HashMap<>();
        normalized.put("provider_reference", firstNonNull(source, "provider_reference", "reference", "transaction_id", "id", "order_id"));
        normalized.put("transaction_ref", transactionRef);
        normalized.put("amount", amount);
        normalized.put("expire_at", firstNonNull(source, "expire_at", "expired_at", "expires_at"));
        normalized.put("qr_content", firstNonNull(source, "qr_content", "qr", "qr_data", "qrCode", "content", "code"));
        normalized.put("qr_image_url", firstNonNull(source, "qr_image_url", "qr_image", "qrImage", "qr_url", "qr_code_url", "qr_code"));
        normalized.put("pay_url", firstNonNull(source, "pay_url", "payment_url", "checkout_url", "hosted_link_url"));
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

    private String resolveApiKey() {
        String configuredKey = normalizeSecret(properties.getApiKey());
        if (!configuredKey.isBlank()) {
            return configuredKey;
        }

        // Runtime fallback in case SEPAY_API_KEY is present but empty and suppresses YAML fallback.
        String tokenAlias = normalizeSecret(System.getenv("SEPAY_API_TOKEN"));
        if (!tokenAlias.isBlank()) {
            return tokenAlias;
        }
        return normalizeSecret(System.getenv("SEPAY_API_KEY"));
    }

    private String resolveBaseUrl() {
        // Runtime env first to avoid Spring placeholder edge case when one env exists but is blank.
        String runtimeBaseUrl = normalizeSecret(System.getenv("SEPAY_BASE_URL"));
        if (!runtimeBaseUrl.isBlank()) {
            return runtimeBaseUrl;
        }

        String runtimeAliasBaseUrl = normalizeSecret(System.getenv("SEPAY_API_BASE_URL"));
        if (!runtimeAliasBaseUrl.isBlank()) {
            return runtimeAliasBaseUrl;
        }

        String configuredBaseUrl = normalizeSecret(properties.getBaseUrl());
        if (!configuredBaseUrl.isBlank()) {
            return configuredBaseUrl;
        }
        return "https://api.sepay.vn";
    }

    private String resolveCreatePath() {
        String envPath = normalizeSecret(System.getenv("SEPAY_CREATE_PATH"));
        if (!envPath.isBlank()) {
            return envPath;
        }

        String configuredPath = normalizeSecret(properties.getCreatePath());
        if (!configuredPath.isBlank()) {
            return configuredPath;
        }
        return "/v1/payments/create";
    }

    private String resolveCreateUrl() {
        String explicitCreateUrl = normalizeSecret(System.getenv("SEPAY_CREATE_URL"));
        if (explicitCreateUrl.isBlank()) {
            explicitCreateUrl = normalizeSecret(properties.getCreateUrl());
        }
        if (!explicitCreateUrl.isBlank()) {
            return explicitCreateUrl;
        }

        String bankAccountId = resolveBankAccountId();
        String bankCode = resolveBankCode();
        if (!bankAccountId.isBlank() && !bankCode.isBlank()) {
            String userApiBase = resolveUserApiBaseUrl();
            return trimSlash(userApiBase) + "/userapi/" + bankCode + "/" + bankAccountId + "/orders";
        }

        String baseUrl = resolveBaseUrl();
        String createPath = resolveCreatePath();
        return trimSlash(baseUrl) + withLeadingSlash(createPath);
    }

    private boolean isUserApiOrderUrl(String url) {
        if (url == null) {
            return false;
        }
        String lower = url.toLowerCase();
        return lower.contains("/userapi/") && lower.endsWith("/orders");
    }

    private Map<String, Object> buildCreateRequestBody(boolean userApiMode,
                                                       String transactionRef,
                                                       BigDecimal amount,
                                                       String description,
                                                       LocalDateTime expireAt) {
        Map<String, Object> body = new HashMap<>();
        if (userApiMode) {
            body.put("amount", normalizeAmount(amount));
            body.put("order_code", transactionRef);
            body.put("duration", calculateDurationSeconds(expireAt));
            body.put("with_qrcode", true);
            if (description != null && !description.isBlank()) {
                body.put("note", description);
            }
            return body;
        }

        body.put("reference", transactionRef);
        body.put("amount", amount);
        body.put("content", description);
        body.put("description", description);
        body.put("expire_at", expireAt != null ? expireAt.toString() : null);
        body.put("return_url", normalizeSecret(properties.getReturnUrl()));
        return body;
    }

    private Object normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        try {
            return amount.longValueExact();
        } catch (ArithmeticException ignored) {
            return amount;
        }
    }

    private long calculateDurationSeconds(LocalDateTime expireAt) {
        if (expireAt == null) {
            return 600;
        }
        long seconds = Duration.between(LocalDateTime.now(), expireAt).getSeconds();
        if (seconds < 60) {
            return 60;
        }
        return seconds;
    }

    private String resolveUserApiBaseUrl() {
        String envValue = normalizeSecret(System.getenv("SEPAY_USERAPI_BASE_URL"));
        if (!envValue.isBlank()) {
            return envValue;
        }
        String configured = normalizeSecret(properties.getUserapiBaseUrl());
        if (!configured.isBlank()) {
            return configured;
        }
        return "https://my.sepay.vn";
    }

    private String resolveBankCode() {
        String envCode = normalizeSecret(System.getenv("SEPAY_BANK_CODE"));
        if (envCode.isBlank()) {
            envCode = normalizeSecret(System.getenv("SEPAY_BANK_NAME"));
        }

        String configured = normalizeSecret(properties.getBankCode());

        String raw = !envCode.isBlank() ? envCode : configured;
        return normalizeBankCode(raw);
    }

    private String resolveBankAccountId() {
        String envId = normalizeSecret(System.getenv("SEPAY_BANK_ACCOUNT_ID"));
        if (envId.isBlank()) {
            envId = normalizeSecret(System.getenv("SEPAY_BANK_ACCOUNT"));
        }
        if (!envId.isBlank()) {
            return envId;
        }
        return normalizeSecret(properties.getBankAccountId());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractPrimaryPayload(Map<String, Object> parsed) {
        if (parsed == null || parsed.isEmpty()) {
            return Map.of();
        }
        Object data = parsed.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            return (Map<String, Object>) dataMap;
        }
        return parsed;
    }

    private String normalizeBankCode(String value) {
        String normalized = normalizeSecret(value).toLowerCase();
        if (normalized.isBlank()) {
            return "";
        }

        normalized = normalized.replaceAll("[^a-z0-9]", "");
        if (normalized.equals("vietinbank")) {
            return "vietinbank";
        }
        if (normalized.equals("bidv")) {
            return "bidv";
        }
        if (normalized.equals("vietcombank")) {
            return "vietcombank";
        }
        if (normalized.equals("techcombank")) {
            return "techcombank";
        }
        return normalized;
    }

    private String normalizeSecret(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
