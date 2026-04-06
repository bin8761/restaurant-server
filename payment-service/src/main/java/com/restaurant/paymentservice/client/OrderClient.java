package com.restaurant.paymentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "order-service", url = "${services.order}")
public interface OrderClient {

    @GetMapping("/api/orders/{id}")
    Map<String, Object> getOrder(@PathVariable("id") Integer orderId);

    @PostMapping("/api/orders/complete-payment")
    Map<String, Object> completePayment(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> payload
    );
}
