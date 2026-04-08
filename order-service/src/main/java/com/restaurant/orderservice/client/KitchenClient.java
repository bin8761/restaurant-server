package com.restaurant.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "kitchen-service", url = "${services.kitchen}")
public interface KitchenClient {

    @PostMapping("/api/kitchen/notify")
    Map<String, Object> notifyNewOrder(@RequestBody Map<String, Object> payload);
}
