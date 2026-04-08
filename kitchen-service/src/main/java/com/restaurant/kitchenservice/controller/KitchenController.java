package com.restaurant.kitchenservice.controller;

import com.restaurant.kitchenservice.entity.KitchenQueue;
import com.restaurant.kitchenservice.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenController {

    private final KitchenService kitchenService;

    @GetMapping("/queue")
    public ResponseEntity<List<Map<String, Object>>> getQueue(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(kitchenService.getQueue(status));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(kitchenService.getStats());
    }

    @PutMapping("/queue/{id}/status")
    public ResponseEntity<KitchenQueue> updateQueueItemStatus(
            @PathVariable @NonNull Integer id,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestParam(required = false) String status
    ) {
        String resolvedStatus = status;

        if ((resolvedStatus == null || resolvedStatus.isBlank()) && payload != null) {
            Object rawStatus = payload.get("status");
            if (rawStatus == null) rawStatus = payload.get("newStatus");
            if (rawStatus == null) rawStatus = payload.get("state");
            if (rawStatus != null) {
                resolvedStatus = String.valueOf(rawStatus);
            }
        }

        return ResponseEntity.ok(kitchenService.updateQueueItemStatus(id, resolvedStatus));
    }

    @DeleteMapping("/queue/{id}")
    public ResponseEntity<Void> deleteQueueItem(@PathVariable @NonNull Integer id) {
        kitchenService.deleteQueueItem(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/queue/completed")
    public ResponseEntity<Void> clearCompletedItems() {
        kitchenService.clearCompletedItems();
        return ResponseEntity.ok().build();
    }

    // Inter-service call
    @PostMapping("/notify")
    public ResponseEntity<Map<String, Object>> notifyNewOrder(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<Integer> addedItems = (List<Integer>) payload.get("added_items");
        Map<String, Object> result = kitchenService.receiveOrderItems(addedItems);
        return ResponseEntity.ok(result);
    }
}
