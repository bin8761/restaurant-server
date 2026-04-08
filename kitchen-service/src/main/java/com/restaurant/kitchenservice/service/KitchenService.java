package com.restaurant.kitchenservice.service;

import com.restaurant.kitchenservice.client.InventoryClient;
import com.restaurant.kitchenservice.client.MenuClient;
import com.restaurant.kitchenservice.client.OrderClient;
import com.restaurant.kitchenservice.dto.FoodDto;
import com.restaurant.kitchenservice.dto.IngredientDto;
import com.restaurant.kitchenservice.dto.InventoryDeductRequest;
import com.restaurant.kitchenservice.entity.KitchenQueue;
import com.restaurant.kitchenservice.repository.KitchenQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.lang.NonNull;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenService {

    private final KitchenQueueRepository kitchenQueueRepository;
    private final OrderClient orderClient;
    private final MenuClient menuClient;
    private final InventoryClient inventoryClient;
    private final SocketService socketService;

    public List<Map<String, Object>> getQueue(String status) {
        try {
            return kitchenQueueRepository.getQueueWithDetails(status);
        } catch (RuntimeException ex) {
            log.warn("Kitchen queue details query failed, fallback to basic queue only: {}", ex.getMessage());
            return kitchenQueueRepository.getQueueBasic(status);
        }
    }

    public Map<String, Object> getStats() {
        return kitchenQueueRepository.getKitchenStats();
    }

    @Transactional
    public void receiveOrderItems(List<Integer> orderDetailIds) {
        for (Integer odId : orderDetailIds) {
            // Skip if already exists (prevent duplicate on re-confirm)
            Integer existing = kitchenQueueRepository.countByOrderDetailId(odId);
            if (existing != null && existing > 0) {
                log.info("KitchenQueue entry already exists for order_detail_id={}, skipping", odId);
                continue;
            }
            KitchenQueue queue = new KitchenQueue();
            queue.setOrderDetailId(odId);
            kitchenQueueRepository.save(queue);
        }

        // 🔔 Emit real-time event — mirrors: io.emit('new_order_items', ...)
        Map<String, Object> payload = new HashMap<>();
        payload.put("added_items", orderDetailIds);
        socketService.emitNewOrderItems(payload);
    }

    @Transactional
    public KitchenQueue updateQueueItemStatus(@NonNull Integer id, String status) {
        KitchenQueue item = kitchenQueueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món trong hàng đợi"));

        item.setStatus(status);
        kitchenQueueRepository.save(item);

        // 🔔 Emit queue status update — mirrors: io.emit('queue_status_updated', ...)
        Map<String, Object> queuePayload = new HashMap<>();
        queuePayload.put("id", item.getId());
        queuePayload.put("order_detail_id", item.getOrderDetailId());
        queuePayload.put("status", item.getStatus());
        queuePayload.put("updated_at", item.getUpdatedAt());
        socketService.emitQueueStatusUpdated(queuePayload);

        Map<String, Object> itemContext = kitchenQueueRepository.findQueueItemContextById(id);
        if (itemContext != null) {
            Number tableIdNumber = (Number) itemContext.get("table_id");
            Map<String, Object> itemPayload = new HashMap<>();
            itemPayload.put("id", itemContext.get("id"));
            itemPayload.put("table_id", itemContext.get("table_id"));
            itemPayload.put("order_id", itemContext.get("order_id"));
            itemPayload.put("order_detail_id", itemContext.get("order_detail_id"));
            itemPayload.put("food_name", itemContext.get("food_name"));
            itemPayload.put("quantity", itemContext.get("quantity"));
            itemPayload.put("status", itemContext.get("status"));
            itemPayload.put("updated_at", itemContext.get("updated_at"));
            socketService.emitTableItemStatus(tableIdNumber != null ? tableIdNumber.intValue() : null, itemPayload);
        }

        // 🔔 If completed, emit delivered event — mirrors: io.emit('queue_item_delivered', ...)
        if ("Hoàn thành".equals(status)) {
            socketService.emitQueueItemDelivered(queuePayload);
            // 🥗 Kích hoạt trừ kho định lượng
            try {
                deductIngredientsForDish(id);
            } catch (Exception e) {
                log.error("Lỗi khi trừ kho định lượng cho món: " + id, e);
            }
        }

        try {
            Integer orderId = kitchenQueueRepository.findOrderIdByOrderDetailId(item.getOrderDetailId());
            if (orderId != null) {
                List<String> queueStatuses = kitchenQueueRepository.findAllStatusesForOrder(orderId);
                String newOrderStatus = null;

                if (!queueStatuses.isEmpty()) {
                    boolean allDone = queueStatuses.stream().allMatch(s -> "Hoàn thành".equals(s));
                    boolean anyCooking = queueStatuses.stream().anyMatch(s -> "Đang chế biến".equals(s));
                    boolean anyPending = queueStatuses.stream().anyMatch(s -> "Chờ chế biến".equals(s));

                    if (allDone) {
                        newOrderStatus = "Hoàn thành";
                    } else if (anyCooking) {
                        newOrderStatus = "Đang nấu";
                    } else if (anyPending) {
                        newOrderStatus = "Đang nấu";
                    }
                }

                if (newOrderStatus != null) {
                    log.info("Syncing order {} status -> {}", orderId, newOrderStatus);
                    orderClient.updateOrderStatus(orderId, Map.of("status", newOrderStatus));

                    // 🔔 Emit order status update — mirrors: io.emit('order_status_updated', ...)
                    Map<String, Object> orderPayload = new HashMap<>();
                    orderPayload.put("order_id", orderId);
                    orderPayload.put("status", newOrderStatus);
                    Number tableIdNumber = itemContext != null ? (Number) itemContext.get("table_id") : null;
                    socketService.emitOrderStatusUpdated(tableIdNumber != null ? tableIdNumber.intValue() : null, orderPayload);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi đồng bộ trạng thái đơn hàng", e);
        }

        return item;
    }

    @Transactional
    public void deleteQueueItem(@NonNull Integer id) {
        kitchenQueueRepository.deleteById(id);

        // 🔔 Emit queue update after deletion
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", id);
        payload.put("deleted", true);
        socketService.emitQueueStatusUpdated(payload);
    }

    @Transactional
    public void clearCompletedItems() {
        kitchenQueueRepository.deleteByStatus("Hoàn thành");

        // 🔔 Emit cleared — mirrors: io.emit('completed_items_cleared', ...)
        Map<String, Object> payload = new HashMap<>();
        payload.put("cleared", true);
        socketService.emitCompletedItemsCleared(payload);
    }

    private void deductIngredientsForDish(Integer queueId) {
        Map<String, Object> data = kitchenQueueRepository.findFoodIdAndQuantityByQueueId(queueId);
        if (data == null || data.get("foodId") == null) {
            log.warn("[TRU KHO] Khong tim thay foodId/quantity cho queueId={}", queueId);
            return;
        }

        Integer foodId = (Integer) data.get("foodId");
        Integer quantity = (Integer) data.get("quantity");
        log.debug("[TRU KHO] foodId={}, quantity={}, queueId={}", foodId, quantity, queueId);

        FoodDto food = null;
        try {
            food = menuClient.getFoodById(foodId);
        } catch (Exception e) {
            log.error("[TRU KHO] Loi goi menu-service laydinh luong foodId={}: {}", foodId, e.getMessage());
            return;
        }

        if (food == null) {
            log.warn("[TRU KHO] menu-service tra null cho foodId={}", foodId);
            return;
        }

        if (food.getIngredients() == null || food.getIngredients().isEmpty()) {
            log.info("[TRU KHO] foodId={} chua co dinh luong nguyen lieu, bo qua", foodId);
            return;
        }

        List<InventoryDeductRequest> requests = new ArrayList<>();
        for (IngredientDto ing : food.getIngredients()) {
            BigDecimal totalAmount = ing.getAmount().multiply(new BigDecimal(quantity));
            log.debug("[TRU KHO]  -> ingredientId={}, amount/phan={}, so phan={}, tong={}",
                    ing.getId(), ing.getAmount(), quantity, totalAmount);
            requests.add(new InventoryDeductRequest(ing.getId(), totalAmount));
        }

        log.debug("[TRU KHO] Goi inventory-service tru {} nguyen lieu cho foodId={}", requests.size(), foodId);
        inventoryClient.deductStock(requests);
        log.debug("[TRU KHO] Thanh cong cho foodId={} x{}", foodId, quantity);
    }
}
