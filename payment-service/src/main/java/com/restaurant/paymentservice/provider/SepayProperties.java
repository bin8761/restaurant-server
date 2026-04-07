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
    private String baseUrl = "https://api.sepay.vn";
    private String createPath = "/v1/payments/create";
    private String verifyPath = "/v1/payments/verify";
    private String apiKey = "";
    private String webhookSecret = "";
    private String returnUrl = "";
    private int timeoutMinutes = 15;
    private String internalAuthHeader = "";
}
