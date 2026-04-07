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
        String secret = properties.getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            return true;
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }

        String expected = hmacSha256Hex(secret, payload == null ? "" : payload);
        return expected.equalsIgnoreCase(signature.trim());
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
}
