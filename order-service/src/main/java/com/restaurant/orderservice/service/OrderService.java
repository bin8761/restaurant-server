package com.restaurant.orderservice.service;

import com.restaurant.orderservice.client.InventoryClient;
import com.restaurant.orderservice.client.KitchenClient;
import com.restaurant.orderservice.client.MenuClient;
import com.restaurant.orderservice.client.PaymentClient;
import com.restaurant.orderservice.client.TableClient;
import com.restaurant.orderservice.dto.OrderDetailResponseDto;
import com.restaurant.orderservice.dto.OrderItemDto;
import com.restaurant.orderservice.dto.OrderRequest;
import com.restaurant.orderservice.dto.OrderResponseDto;
import com.restaurant.orderservice.dto.OrderSessionDetailDto;
import com.restaurant.orderservice.dto.OrderSessionSummaryDto;
import com.restaurant.orderservice.entity.Order;
import com.restaurant.orderservice.entity.OrderDetail;
import com.restaurant.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import feign.FeignException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final TableClient tableClient;
    private final MenuClient menuClient;
    private final KitchenClient kitchenClient;
    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;
    private final SocketService socketService;

    private boolean hasItems(OrderRequest request) {
        return request.getItems() != null && !request.getItems().isEmpty();
    }

    private boolean isBuffetActivationOrder(OrderRequest request) {
        return Boolean.TRUE.equals(request.getIs_buffet()) && !hasItems(request);
    }

    private boolean isBuffetFoodOrder(OrderRequest request) {
        return Boolean.TRUE.equals(request.getIs_buffet()) && hasItems(request);
    }

    private void enrichFoodNames(List<Order> orders) {
        List<Integer> foodIds = orders.stream()
                .flatMap(order -> order.getDetails().stream())
                .map(OrderDetail::getFoodId)
                .filter(id -> id != null)
                .distinct()
                .toList();

        if (foodIds.isEmpty()) {
            return;
        }

        Map<Integer, String> foodNameMap = new HashMap<>();
        try {
            foodNameMap = menuClient.getFoodNames(foodIds);
        } catch (Exception e) {
            log.warn("Không thể lấy tên món từ menu-service: {}", e.getMessage());
        }

        for (Order order : orders) {
            for (OrderDetail detail : order.getDetails()) {
                String foodName = foodNameMap.get(detail.getFoodId());
                if (foodName == null) {
                    foodName = "Món #" + detail.getFoodId();
                }
                detail.setFoodName(foodName);
            }
        }
    }

    private OrderDetailResponseDto toDetailResponse(OrderDetail detail) {
        BigDecimal price = detail.getPrice() != null ? detail.getPrice() : BigDecimal.ZERO;
        int quantity = detail.getQuantity() != null ? detail.getQuantity() : 0;
        return OrderDetailResponseDto.builder()
                .id(detail.getId())
                .food_id(detail.getFoodId())
                .food_name(detail.getFoodName())
                .menu_item_name(detail.getFoodName())
                .quantity(quantity)
                .price(price)
                .line_total(price.multiply(BigDecimal.valueOf(quantity)))
                .build();
    }

    private OrderResponseDto toOrderResponse(Order order) {
        List<OrderDetailResponseDto> detailDtos = order.getDetails().stream()
                .map(this::toDetailResponse)
                .toList();

        return OrderResponseDto.builder()
                .id(order.getId())
                .table_id(order.getTableId())
                .user_id(order.getUserId())
                .table_key(order.getTableKey())
                .order_time(order.getOrderTime())
                .created_at(order.getOrderTime())
                .status(order.getStatus())
                .total(order.getTotal())
                .is_buffet(order.getIsBuffet())
                .buffet_session_id(order.getBuffetSessionId())
                .buffet_package_id(order.getBuffetPackageId())
                .buffet_package_name(order.getBuffetPackageName())
                .payment_status(order.getPaymentStatus())
                .updated_at(order.getUpdatedAt())
                .details(detailDtos)
                .items(detailDtos)
                .build();
    }

    private String resolveSessionPaymentStatus(List<Order> orders) {
        boolean hasWaiting = orders.stream().anyMatch(order ->
                "waiting".equalsIgnoreCase(order.getPaymentStatus())
                        || "pending".equalsIgnoreCase(order.getPaymentStatus()));
        if (hasWaiting) {
            return "waiting";
        }

        boolean hasUnpaid = orders.stream().anyMatch(order -> !"paid".equalsIgnoreCase(order.getPaymentStatus()));
        if (hasUnpaid) {
            return "unpaid";
        }

        return orders.isEmpty() ? "unpaid" : "paid";
    }

    private String resolveSessionStatus(List<Order> orders) {
        if (orders.stream().anyMatch(order -> "Chờ xác nhận".equals(order.getStatus()))) {
            return "Chờ xác nhận";
        }
        if (orders.stream().anyMatch(order -> "Đang nấu".equals(order.getStatus()))) {
            return "Đang nấu";
        }
        if (orders.stream().allMatch(order -> "Hoàn thành".equals(order.getStatus()))) {
            return "Hoàn thành";
        }
        return orders.isEmpty() ? "Chờ xác nhận" : orders.get(orders.size() - 1).getStatus();
    }

    public OrderResponseDto getOrderResponseById(@NonNull Integer id) {
        return toOrderResponse(getOrderById(id));
    }

    public List<OrderResponseDto> getAllOrderResponses() {
        return getAllOrders().stream().map(this::toOrderResponse).toList();
    }

    public List<OrderResponseDto> getOrderResponsesByTable(Integer tableId, String tableKey) {
        return getOrdersByTable(tableId, tableKey).stream().map(this::toOrderResponse).toList();
    }

    public OrderSessionSummaryDto getSessionSummary(Integer tableId, String tableKey) {
        List<Order> orders = getOrdersByTable(tableId, tableKey);
        return buildSessionSummary(tableId, tableKey, orders);
    }

    private OrderSessionSummaryDto buildSessionSummary(Integer tableId, String tableKey, List<Order> orders) {
        BigDecimal totalAmount = orders.stream()
                .map(Order::getTotal)
                .filter(total -> total != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = orders.stream()
                .flatMap(order -> order.getDetails().stream())
                .mapToInt(detail -> detail.getQuantity() != null ? detail.getQuantity() : 0)
                .sum();

        Order buffetOrder = orders.stream()
                .filter(order -> Boolean.TRUE.equals(order.getIsBuffet()) && order.getBuffetSessionId() != null)
                .reduce((first, second) -> second)
                .orElse(null);

        Order latestOrder = orders.stream().reduce((first, second) -> second).orElse(null);

        return OrderSessionSummaryDto.builder()
                .representative_order_id(orders.isEmpty() ? null : orders.get(0).getId())
                .table_id(tableId)
                .table_key(tableKey)
                .total_orders(orders.size())
                .total_items(totalItems)
                .total_amount(totalAmount)
                .status(resolveSessionStatus(orders))
                .payment_status(resolveSessionPaymentStatus(orders))
                .buffet_active(buffetOrder != null && !"paid".equalsIgnoreCase(buffetOrder.getPaymentStatus()))
                .buffet_package_name(buffetOrder != null ? buffetOrder.getBuffetPackageName() : null)
                .last_order_time(latestOrder != null ? latestOrder.getOrderTime() : null)
                .build();
    }

    public List<OrderSessionSummaryDto> getAllSessionSummaries() {
        List<Order> orders = getAllOrders();
        Map<String, List<Order>> groupedOrders = orders.stream()
                .filter(order -> order.getTableId() != null)
                .collect(Collectors.groupingBy(order -> order.getTableId() + "_" + (order.getTableKey() != null ? order.getTableKey() : "no_key")));

        return groupedOrders.values().stream()
                .map(sessionOrders -> {
                    Order firstOrder = sessionOrders.get(0);
                    return buildSessionSummary(firstOrder.getTableId(), firstOrder.getTableKey(), sessionOrders);
                })
                .sorted((left, right) -> {
                    if (left.getLast_order_time() == null && right.getLast_order_time() == null) return 0;
                    if (left.getLast_order_time() == null) return 1;
                    if (right.getLast_order_time() == null) return -1;
                    return right.getLast_order_time().compareTo(left.getLast_order_time());
                })
                .toList();
    }

    public OrderSessionDetailDto getSessionDetail(Integer tableId, String tableKey) {
        List<Order> orders = getOrdersByTable(tableId, tableKey);
        return OrderSessionDetailDto.builder()
                .summary(buildSessionSummary(tableId, tableKey, orders))
                .orders(orders.stream().map(this::toOrderResponse).toList())
                .build();
    }

    @Transactional(timeout = 30)
    public Order createOrder(OrderRequest request) {
        boolean isStaffRequest = request.getUser_id() != null;

        log.info("🛒 Creating order - Table: {}, Is Buffet: {}, Items: {}",
                request.getTable_id(), request.getIs_buffet(),
                request.getItems() != null ? request.getItems().size() : "NULL");

        if (!isStaffRequest && request.getTable_key() == null) {
            throw new RuntimeException("Thiếu table_key");
        }

        if (!isBuffetActivationOrder(request) && !hasItems(request)) {
            throw new RuntimeException("Đơn hàng phải có ít nhất một món");
        }

        if (request.getTable_key() != null) {
            Boolean isValid = true;
            try {
                isValid = tableClient.validateTableKey(request.getTable_id(), request.getTable_key());
            } catch (Exception e) {
                log.warn("Lỗi validate table key, giả lập trả về true phục vụ demo");
            }
            if (isValid != null && !isValid) {
                throw new RuntimeException("Key không hợp lệ hoặc đã hết hạn");
            }
        }

        List<Integer> foodIds = hasItems(request)
                ? request.getItems().stream()
                    .map(OrderItemDto::getFood_id)
                    .distinct()
                    .collect(Collectors.toList())
                : List.of();

        log.info("🍽️ Food IDs from request: {}", foodIds);

        Map<Integer, BigDecimal> foodPriceMap = new HashMap<>();
        if (!foodIds.isEmpty()) {
            try {
                foodPriceMap = menuClient.getFoodPrices(foodIds);
                log.info("✅ Got prices from menu-service: {}", foodPriceMap);
            } catch (Exception e) {
                log.error("❌ Không thể lấy giá món từ menu-service: {}", e.getMessage());
                throw new RuntimeException("Không thể lấy giá món từ menu-service, vui lòng thử lại sau");
            }
            List<Integer> missingPriceFoodIds = new ArrayList<>();
            for (Integer id : foodIds) {
                if (!foodPriceMap.containsKey(id) || foodPriceMap.get(id) == null) {
                    missingPriceFoodIds.add(id);
                }
            }
            if (!missingPriceFoodIds.isEmpty()) {
                throw new RuntimeException("Thiếu giá cho món: " + missingPriceFoodIds);
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        if (isBuffetActivationOrder(request)) {
            total = request.getBuffet_price() != null ? request.getBuffet_price() : new BigDecimal("299000");
            log.info("📊 Buffet order - Price: {}", total);
        } else if (isBuffetFoodOrder(request)) {
            total = BigDecimal.ZERO;
            log.info("📊 Buffet item order - session={}, total={}", request.getBuffet_session_id(), total);
        } else {
            for (OrderItemDto item : request.getItems()) {
                BigDecimal price = foodPriceMap.get(item.getFood_id());
                if (price == null) {
                    log.error("❌ Food not found in price map - Food ID: {}, Available IDs: {}", item.getFood_id(), foodPriceMap.keySet());
                    throw new RuntimeException("Không tìm thấy món " + item.getFood_id());
                }
                BigDecimal itemTotal = price.multiply(new BigDecimal(item.getQuantity()));
                total = total.add(itemTotal);
                log.info("📦 Adding item - Food ID: {}, Price: {}, Quantity: {}, Item Total: {}",
                        item.getFood_id(), price, item.getQuantity(), itemTotal);
            }
            log.info("✅ Order total calculated: {} from {} items", total, request.getItems().size());
        }

        Order order = new Order();
        order.setTableId(request.getTable_id());
        order.setUserId(request.getUser_id());
        order.setTotal(total);
        order.setTableKey(request.getTable_key());
        order.setIsBuffet(request.getIs_buffet());
        order.setBuffetPackageId(request.getBuffet_package_id());
        order.setBuffetPackageName(request.getBuffet_package_name());
        order.setStatus("Chờ xác nhận");
        order.setPaymentStatus("unpaid");

        if (isBuffetActivationOrder(request)) {
            // BUG-022: Luôn generate buffet_session_id server-side, không tin FE
            String buffetSessionId = UUID.randomUUID().toString();
            order.setBuffetSessionId(buffetSessionId);
        } else if (isBuffetFoodOrder(request)) {
            Order activeBuffetOrder = orderRepository
                    .findFirstByTableIdAndTableKeyAndIsBuffetTrueAndPaymentStatusNotAndBuffetSessionIdIsNotNullOrderByOrderTimeDesc(
                            request.getTable_id(),
                            request.getTable_key(),
                            "paid");

            if (activeBuffetOrder == null) {
                throw new RuntimeException("Chưa có phiên buffet hợp lệ cho bàn này");
            }

            order.setBuffetSessionId(activeBuffetOrder.getBuffetSessionId());
            if (order.getBuffetPackageId() == null) {
                order.setBuffetPackageId(activeBuffetOrder.getBuffetPackageId());
            }
            if (order.getBuffetPackageName() == null) {
                order.setBuffetPackageName(activeBuffetOrder.getBuffetPackageName());
            }
        }

        if (hasItems(request)) {
            for (OrderItemDto item : request.getItems()) {
                OrderDetail detail = new OrderDetail();
                detail.setOrder(order);
                detail.setFoodId(item.getFood_id());
                detail.setQuantity(item.getQuantity());

                if (Boolean.TRUE.equals(request.getIs_buffet())) {
                    detail.setPrice(BigDecimal.ZERO);
                } else {
                    detail.setPrice(foodPriceMap.get(item.getFood_id()));
                }
                order.getDetails().add(detail);
            }
        }

        Order savedOrder = orderRepository.save(order);

        try {
            tableClient.updateTableStatus(request.getTable_id(), "Chờ xác nhận", false);
        } catch (Exception e) {
            log.warn("Lỗi update table status, ignore for demo");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", savedOrder.getId());
        payload.put("table_id", savedOrder.getTableId());
        payload.put("status", savedOrder.getStatus());
        payload.put("payment_status", savedOrder.getPaymentStatus());
        payload.put("is_buffet", savedOrder.getIsBuffet());
        payload.put("buffet_session_id", savedOrder.getBuffetSessionId());
        payload.put("buffet_package_name", savedOrder.getBuffetPackageName());

        if (isBuffetActivationOrder(request)) {
            socketService.emitBuffetOrderCreated(savedOrder.getTableId(), payload);
        } else if (isBuffetFoodOrder(request)) {
            socketService.emitBuffetFoodAdded(savedOrder.getTableId(), payload);
        } else {
            socketService.emitOrderCreated(savedOrder.getTableId(), payload);
        }

        return savedOrder;
    }

    public List<Order> getOrdersByTable(Integer tableId, String tableKey) {
        List<Order> orders = orderRepository.findByTableIdAndTableKeyAndPaymentStatusNotOrderByOrderTimeAsc(tableId, tableKey, "paid");
        enrichFoodNames(orders);
        return orders;
    }

    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        enrichFoodNames(orders);
        return orders;
    }

    public Order getOrderById(@NonNull Integer id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy đơn"));
        enrichFoodNames(List.of(order));
        return order;
    }

    @Transactional
    public Order updateOrderStatus(@NonNull Integer id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        Map<String, Object> payload = new HashMap<>();
        payload.put("order_id", savedOrder.getId());
        payload.put("table_id", savedOrder.getTableId());
        payload.put("status", savedOrder.getStatus());
        payload.put("payment_status", savedOrder.getPaymentStatus());
        socketService.emitOrderStatusUpdated(savedOrder.getTableId(), payload);

        return savedOrder;
    }
    @Transactional
    public void confirmOrder(@NonNull Integer id) {
        Order order = getOrderById(id);
        if ("paid".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Đơn đã thanh toán");
        }

        if (!"Chờ xác nhận".equals(order.getStatus())) {
            log.info("Order {} already processed with status '{}', skip re-confirm", id, order.getStatus());
            return;
        }

        List<Integer> detailIds = order.getDetails().stream()
                .map(OrderDetail::getId)
                .collect(Collectors.toList());

        // BUG-024: Gọi kitchen TRƯỚC khi update status — nếu thất bại thì rollback
        // Exception từ kitchenClient sẽ được propagate lên, transaction sẽ rollback
        Map<String, Object> kitchenNotifyResult;
        try {
            kitchenNotifyResult = kitchenClient.notifyNewOrder(Map.of("added_items", detailIds));
        } catch (Exception e) {
            log.error("Kitchen service unavailable - cancel confirm order {}: {}", id, e.getMessage());
            throw new RuntimeException("Khong the gui order den bep: " + e.getMessage());
        }
        int insertedCount = toInt(kitchenNotifyResult.get("inserted_count"));
        if (!detailIds.isEmpty() && insertedCount <= 0) {
            throw new RuntimeException("Kitchen notify thanh cong nhung khong tao duoc queue item");
        }

        order.setStatus("Đang nấu");
        Order savedOrder = orderRepository.save(order);

        // BUG-030: Tự động trừ tồn kho nguyên liệu
        deductInventoryForOrder(order);

        Map<String, Object> payload = new HashMap<>();
        payload.put("order_id", savedOrder.getId());
        payload.put("table_id", savedOrder.getTableId());
        payload.put("status", savedOrder.getStatus());
        payload.put("payment_status", savedOrder.getPaymentStatus());
        socketService.emitOrderStatusUpdated(savedOrder.getTableId(), payload);
    }

    /**
     * BUG-030: Trừ kho nguyên liệu cho tất cả món trong order.
     * Lỗi bên inventory không làm hỏng luồng confirm — chỉ log warning.
     */
    private void deductInventoryForOrder(Order order) {
        try {
            List<Integer> foodIds = order.getDetails().stream()
                    .map(OrderDetail::getFoodId)
                    .distinct()
                    .collect(Collectors.toList());
            if (foodIds.isEmpty()) return;

            // Map: foodId → [{ingredient_id, amount}]
            Map<Integer, List<Map<String, Object>>> ingredientMap =
                    menuClient.getFoodIngredients(foodIds);

            // Tổng hợp: ingredientId → tổng lượng cần trừ (amount * quantity)
            Map<Integer, BigDecimal> totals = new HashMap<>();
            for (OrderDetail detail : order.getDetails()) {
                List<Map<String, Object>> ingredients = ingredientMap.get(detail.getFoodId());
                if (ingredients == null || ingredients.isEmpty()) continue;
                for (Map<String, Object> ing : ingredients) {
                    Integer ingId = ((Number) ing.get("ingredient_id")).intValue();
                    BigDecimal amount = new BigDecimal(ing.get("amount").toString())
                            .multiply(new BigDecimal(detail.getQuantity()));
                    totals.merge(ingId, amount, BigDecimal::add);
                }
            }

            if (totals.isEmpty()) return;

            List<Map<String, Object>> deductRequests = new ArrayList<>();
            for (Map.Entry<Integer, BigDecimal> entry : totals.entrySet()) {
                Map<String, Object> req = new HashMap<>();
                req.put("ingredient_id", entry.getKey());
                req.put("amount", entry.getValue());
                deductRequests.add(req);
            }
            inventoryClient.batchDeduct(deductRequests);
            log.info("✅ Đã trừ kho {} nguyên liệu cho order {}", deductRequests.size(), order.getId());
        } catch (Exception e) {
            log.warn("⚠️ Không thể trừ kho cho order {} — inventory service lỗi: {}", order.getId(), e.getMessage());
            // Không throw — tránh rollback order đã confirmed thành công
        }
    }

    @Transactional
    public Map<String, Object> confirmSessionOrders(Integer tableId, String tableKey) {

        List<Order> sessionOrders = orderRepository
                .findByTableIdAndTableKeyAndPaymentStatusNotOrderByOrderTimeAsc(tableId, tableKey, "paid");

        if (sessionOrders.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn hàng nào trong phiên bàn");
        }

        List<Order> pendingOrders = sessionOrders.stream()
                .filter(order -> "Chờ xác nhận".equals(order.getStatus()))
                .toList();

        if (pendingOrders.isEmpty()) {
            return Map.of(
                    "success", true,
                    "confirmed_count", 0,
                    "skipped_count", sessionOrders.size(),
                    "message", "Không còn đơn nào chờ xác nhận trong phiên bàn này"
            );
        }

        List<Integer> detailIds = pendingOrders.stream()
                .flatMap(order -> order.getDetails().stream())
                .map(OrderDetail::getId)
                .toList();

        Map<String, Object> kitchenNotifyResult;
        try {
            kitchenNotifyResult = kitchenClient.notifyNewOrder(Map.of("added_items", detailIds));
        } catch (Exception e) {
            log.error("Kitchen service unavailable when confirming session {}-{}: {}", tableId, tableKey, e.getMessage());
            throw new RuntimeException("Khong the gui mon sang bep: " + e.getMessage());
        }
        int insertedCount = toInt(kitchenNotifyResult.get("inserted_count"));
        if (!detailIds.isEmpty() && insertedCount <= 0) {
            throw new RuntimeException("Kitchen notify thanh cong nhung khong tao duoc queue item");
        }
        int skippedCountFromKitchen = toInt(kitchenNotifyResult.get("skipped_count"));

        pendingOrders.forEach(order -> order.setStatus("Đang nấu"));
        List<Order> savedOrders = orderRepository.saveAll(pendingOrders);

        for (Order savedOrder : savedOrders) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("order_id", savedOrder.getId());
            payload.put("table_id", savedOrder.getTableId());
            payload.put("status", savedOrder.getStatus());
            payload.put("payment_status", savedOrder.getPaymentStatus());
            socketService.emitOrderStatusUpdated(savedOrder.getTableId(), payload);
        }

        return Map.of(
                "success", true,
                "confirmed_count", savedOrders.size(),
                "skipped_count", sessionOrders.size() - savedOrders.size(),
                "detail_count", detailIds.size(),
                "kitchen_inserted_count", insertedCount,
                "kitchen_skipped_count", skippedCountFromKitchen,
                "message", "Đã gửi " + savedOrders.size() + " đơn chờ xác nhận sang bếp"
        );
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) return 0;
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    @Transactional
    public Map<String, Object> requestPayment(@NonNull Integer orderId, String tableKey) {
        Order seedOrder = getOrderById(orderId);

        if (seedOrder.getTableKey() == null || tableKey == null || !seedOrder.getTableKey().equals(tableKey)) {
            throw new RuntimeException("Phiên bàn không hợp lệ");
        }

        List<Order> sessionOrders = orderRepository
                .findByTableIdAndTableKeyAndPaymentStatusNotOrderByOrderTimeAsc(
                        seedOrder.getTableId(),
                        seedOrder.getTableKey(),
                        "paid");

        if (sessionOrders.isEmpty()) {
            throw new RuntimeException("Không có đơn chưa thanh toán cho phiên bàn này");
        }

        // BUG-010: Lọc ra chỉ những order thực sự còn "unpaid" (chưa gửi yêu cầu)
        List<Order> pendingOrders = sessionOrders.stream()
                .filter(o -> "unpaid".equals(o.getPaymentStatus()))
                .toList();
        if (pendingOrders.isEmpty()) {
            throw new RuntimeException("Yêu cầu thanh toán đã được gửi trước đó");
        }

        boolean hasUnfinishedOrders = pendingOrders.stream()
                .anyMatch(order -> !"Hoàn thành".equalsIgnoreCase(order.getStatus()));
        if (hasUnfinishedOrders) {
            throw new RuntimeException("Chỉ có thể yêu cầu thanh toán khi toàn bộ món trong phiên đã hoàn thành");
        }

        BigDecimal sessionTotal = BigDecimal.ZERO;
        for (Order order : pendingOrders) {
            if (order.getTotal() != null) {
                sessionTotal = sessionTotal.add(order.getTotal());
            }

            order.setPaymentStatus("waiting");
            orderRepository.save(order);

            Map<String, Object> req = new HashMap<>();
            req.put("order_id", order.getId());
            req.put("table_id", order.getTableId());
            req.put("table_key", order.getTableKey());
            req.put("amount", order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO);

            try {
                paymentClient.requestPayment(req);
            } catch (FeignException e) {
                String responseBody = e.contentUTF8();
                String detail = (responseBody != null && !responseBody.isBlank()) ? responseBody : e.getMessage();
                log.error("Lỗi khi gửi yêu cầu thanh toán tới payment-service cho order {}: status={}, detail={}",
                        order.getId(), e.status(), detail, e);
                throw new RuntimeException("Không thể tạo yêu cầu thanh toán: " + detail);
            } catch (Exception e) {
                log.error("Lỗi khi gửi yêu cầu thanh toán tới payment-service cho order {}: {}", order.getId(), e.getMessage(), e);
                throw new RuntimeException("Lỗi hệ thống khi yêu cầu thanh toán: " + e.getMessage());
            }
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("table_id", seedOrder.getTableId());
        payload.put("table_key", seedOrder.getTableKey());
        payload.put("payment_status", "waiting");
        payload.put("order_ids", pendingOrders.stream().map(Order::getId).toList());
        payload.put("total_amount", sessionTotal);
        socketService.emitOrderStatusUpdated(seedOrder.getTableId(), payload);

        return Map.of(
                "success", true,
                "message", "Đã gửi yêu cầu thanh toán",
                "order_count", sessionOrders.size(),
                "total_amount", sessionTotal
        );
    }

    @Transactional
    public Map<String, Object> completePayment(Integer tableId, String tableKey, List<Integer> orderIds) {
        log.info("💳 Completing payment - Table: {}, Orders: {}", tableId, orderIds);

        if (tableId == null) {
            throw new RuntimeException("Thiếu thông tin bàn (table_id)");
        }

        List<Order> orders;
        if (tableKey != null && !tableKey.isBlank()) {
            orders = orderRepository.findByTableIdAndTableKeyAndPaymentStatusNotOrderByOrderTimeAsc(
                    tableId,
                    tableKey,
                    "paid");
        } else {
            orders = orderRepository.findAllById(orderIds);
        }
        if (orders.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn hàng để hoàn tất thanh toán");
        }

        List<Integer> completedOrderIds = orders.stream().map(Order::getId).toList();

        for (Order order : orders) {
            if (!order.getTableId().equals(tableId)) {
                throw new RuntimeException("Đơn hàng không thuộc bàn đang thanh toán");
            }
            if (tableKey != null && order.getTableKey() != null && !tableKey.equals(order.getTableKey())) {
                throw new RuntimeException("Đơn hàng không thuộc phiên bàn đang thanh toán");
            }
            // BUG-003: Ngăn thanh toán 2 lần
            if ("paid".equals(order.getPaymentStatus())) {
                log.warn("⚠️ Order {} đã được thanh toán trước đó, bỏ qua", order.getId());
                continue;
            }
            order.setPaymentStatus("paid");
            order.setStatus("Hoàn thành");
            orderRepository.save(order);
            log.info("✅ Order {} marked as paid", order.getId());
        }

        try {
            tableClient.invalidateTableKey(tableId);
            log.info("🔒 Table key invalidated for table: {}", tableId);
        } catch (Exception e) {
            log.warn("⚠️ Failed to invalidate table key: {}", e.getMessage());
        }

        try {
            tableClient.updateTableStatus(tableId, "Trống", false);
            log.info("🧹 Table {} marked as empty", tableId);
        } catch (Exception e) {
            log.warn("⚠️ Failed to update table status: {}", e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Đã hoàn tất thanh toán và đóng bàn");
        result.put("order_ids", completedOrderIds);
        result.put("table_id", tableId);

        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("table_id", tableId);
        wsPayload.put("table_key", tableKey);
        wsPayload.put("payment_status", "paid");
        wsPayload.put("status", "Hoàn thành");
        wsPayload.put("order_ids", completedOrderIds);
        socketService.emitPaymentCompleted(tableId, wsPayload);

        log.info("✅ Payment completed successfully - Table {} is now empty", tableId);
        return result;
    }
}





