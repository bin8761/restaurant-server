package com.restaurant.paymentservice.provider;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.sepay")
public class SepayProperties {
    private String createUrl = "";
    private String baseUrl = "https://api.sepay.vn";
    private String createPath = "/v1/payments/create";
    private String verifyPath = "/v1/payments/verify";
    private String userapiBaseUrl = "https://my.sepay.vn";
    private boolean userapiEnabled = false;
    private boolean directQrFallbackEnabled = true;
    private String bankCode = "";
    private String bankAccountId = "";
    private int httpConnectTimeoutMs = 8000;
    private int httpReadTimeoutMs = 15000;
    private String apiKey = "";
    private String webhookSecret = "";
    private String returnUrl = "";
    private int timeoutMinutes = 15;
    private String internalAuthHeader = "";
}
