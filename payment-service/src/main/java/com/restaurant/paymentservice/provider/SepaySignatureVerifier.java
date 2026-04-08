package com.restaurant.paymentservice.provider;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Component
public class SepaySignatureVerifier {

    private final SepayProperties properties;

    public SepaySignatureVerifier(SepayProperties properties) {
        this.properties = properties;
    }

    public boolean isValid(String payload, String signature) {
        return isValid(payload, signature, null, null, null);
    }

    public boolean isValid(String payload,
                           String signature,
                           String authorizationHeader,
                           String xApiKeyHeader,
                           String apiKeyHeader) {
        String secret = properties.getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            return true;
        }

        String normalizedSecret = normalizeToken(secret);
        String normalizedSignature = signature == null ? "" : signature.trim();
        if (!normalizedSignature.isBlank()) {
            String expected = hmacSha256Hex(secret, payload == null ? "" : payload);
            return expected.equalsIgnoreCase(normalizedSignature);
        }

        String authToken = normalizeToken(authorizationHeader);
        if (!authToken.isBlank() && normalizedSecret.equals(authToken)) {
            return true;
        }

        String xApiKey = normalizeToken(xApiKeyHeader);
        if (!xApiKey.isBlank() && normalizedSecret.equals(xApiKey)) {
            return true;
        }

        String apiKey = normalizeToken(apiKeyHeader);
        return !apiKey.isBlank() && normalizedSecret.equals(apiKey);
    }

    private String hmacSha256Hex(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim();
        if ((normalized.startsWith("\"") && normalized.endsWith("\"")) ||
            (normalized.startsWith("'") && normalized.endsWith("'"))) {
            normalized = normalized.substring(1, normalized.length() - 1).trim();
        }

        String lower = normalized.toLowerCase();
        if (lower.startsWith("apikey ")) {
            return normalized.substring(7).trim();
        }
        if (lower.startsWith("api_key ")) {
            return normalized.substring(8).trim();
        }
        if (lower.startsWith("bearer ")) {
            return normalized.substring(7).trim();
        }
        return normalized;
    }
}
