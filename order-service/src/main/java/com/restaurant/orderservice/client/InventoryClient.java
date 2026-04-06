package com.restaurant.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

/**
 * BUG-030: Feign client để trừ tồn kho khi confirm order.
 */
@FeignClient(name = "inventory-service", url = "${services.inventory}")
public interface InventoryClient {

    @PostMapping("/api/inventory/ingredients/batch-deduct")
    void batchDeduct(@RequestBody List<Map<String, Object>> requests);
}
