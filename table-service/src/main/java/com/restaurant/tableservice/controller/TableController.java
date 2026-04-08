package com.restaurant.tableservice.controller;

import com.restaurant.tableservice.entity.RestaurantTable;
import com.restaurant.tableservice.service.TableService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getTables() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getTableById(@PathVariable @NonNull Integer id) {
        return ResponseEntity.ok(tableService.getTableById(id));
    }

    @GetMapping("/{id}/reservations")
    public ResponseEntity<List<com.restaurant.tableservice.entity.TableReservation>> getReservations(
            @PathVariable @NonNull Integer id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(tableService.getReservations(id, from, to));
    }

    @PostMapping("/{id}/reservations")
    public ResponseEntity<com.restaurant.tableservice.entity.TableReservation> createReservation(
            @PathVariable @NonNull Integer id,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        // Luôn tạo mutable copy để tránh sửa đổi map gốc
        payload = new java.util.HashMap<>(payload);

        Object userIdAttr = request.getAttribute("userId");
        String roleName = (String) request.getAttribute("roleName");
        if (userIdAttr != null) {
            if (!payload.containsKey("customer_id") || payload.get("customer_id") == null) {
                payload.put("customer_id", ((Number) userIdAttr).intValue());
            } else if ("CUSTOMER".equalsIgnoreCase(roleName)) {
                // BUG-020: CUSTOMER không được mạo danh customer_id khác
                payload.put("customer_id", ((Number) userIdAttr).intValue());
            }
        } else {
            // BUG-020: Unauthenticated — xóa customer_id để ngăn injection giả mạo
            payload.remove("customer_id");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createReservation(id, payload));
    }

    @GetMapping("/reservations/my")
    public ResponseEntity<List<com.restaurant.tableservice.entity.TableReservation>> getMyReservations(
            HttpServletRequest request) {
        Object userIdAttr = request.getAttribute("userId");
        if (userIdAttr == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Integer customerId = ((Number) userIdAttr).intValue();
        return ResponseEntity.ok(tableService.getMyReservations(customerId));
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<com.restaurant.tableservice.entity.TableReservation>> getAllReservations(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(tableService.getAllReservations(status));
    }

    @GetMapping("/admin/reservations")
    public ResponseEntity<List<com.restaurant.tableservice.entity.TableReservation>> getAllReservationsForAdmin(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(tableService.getAllReservations(status));
    }

    /**
     * Trả về reservation pending/confirmed tiếp theo của bàn.
     * Admin FE gọi để hiển thị cảnh báo trước khi cấp key.
     */
    @GetMapping("/{id}/upcoming-reservation")
    public ResponseEntity<?> getUpcomingReservation(@PathVariable @NonNull Integer id) {
        return tableService.getUpcomingReservation(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/reservations/availability")
    public ResponseEntity<Map<String, Object>> checkReservationAvailability(
            @PathVariable @NonNull Integer id,
            @RequestParam String start,
            @RequestParam String end) {
        boolean available = tableService.isReservationAvailable(id, start, end);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PutMapping("/reservations/{reservationId}/status")
    public ResponseEntity<com.restaurant.tableservice.entity.TableReservation> updateReservationStatus(
            @PathVariable @NonNull Integer reservationId,
            @RequestBody Map<String, Object> payload) {
        String status = payload.get("status") != null ? payload.get("status").toString() : null;
        return ResponseEntity.ok(tableService.updateReservationStatus(reservationId, status));
    }

    /**
     * Nhận bàn (check-in): khách đã đặt bàn (confirmed) đến nhận bàn thực tế.
     *
     * Luồng:
     *   Staff bấm "Nhận bàn" trên admin FE
     *   → Backend tạo QR key cho bàn + cập nhật reservation → serving
     *   → Admin FE hiển thị QR cho khách quét để bắt đầu gọi món
     *
     * Response: tất cả fields của /qr/dynamic + reservation_id, customer_name, table_name
     */
    @PostMapping("/reservations/{reservationId}/checkin")
    public ResponseEntity<Map<String, Object>> checkinReservation(
            @PathVariable @NonNull Integer reservationId) {
        return ResponseEntity.ok(tableService.checkinReservation(reservationId));
    }

    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(@RequestBody @NonNull RestaurantTable table) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createTable(table));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(@PathVariable @NonNull Integer id, @RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String status = (String) payload.get("status");
        Boolean isBuffet = payload.containsKey("is_buffet") ? (Boolean) payload.get("is_buffet")
                         : payload.containsKey("isBuffet") ? (Boolean) payload.get("isBuffet") : null;
        Integer capacity = payload.get("capacity") != null ? ((Number) payload.get("capacity")).intValue() : null;
        return ResponseEntity.ok(tableService.updateTable(id, name, status, isBuffet, capacity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable @NonNull Integer id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Xác thực table key cho khách dine-in.
     *
     * Đổi sang POST để key không xuất hiện trong URL, server logs và browser history.
     * Body: { "tableKey": "uuid", "deviceSession": "optional-device-id" }
     * Response: { valid, reason, seconds_remaining, expires_at }
     *   reason values: "ok" | "not_found" | "expired" | "taken"
     */
    @PostMapping("/{id}/validate-key")
    public ResponseEntity<Map<String, Object>> validateTableKey(
            @PathVariable @NonNull Integer id,
            @RequestBody Map<String, Object> body) {
        String tableKey = body.get("tableKey") != null ? body.get("tableKey").toString() : null;
        String deviceSession = body.get("deviceSession") != null ? body.get("deviceSession").toString() : null;
        if (tableKey == null || tableKey.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "reason", "missing_key", "seconds_remaining", 0));
        }
        return ResponseEntity.ok(tableService.validateTableKey(id, tableKey, deviceSession));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateTableStatus(@PathVariable @NonNull Integer id, @RequestParam String status, @RequestParam Boolean isBuffet) {
        tableService.updateTable(id, null, status, isBuffet, null);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/keys/invalidate")
    public ResponseEntity<Void> invalidateKeysExternal(@PathVariable @NonNull Integer id) {
        tableService.invalidateTableKey(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reservation/guest-counts")
    public ResponseEntity<Void> updateReservationGuestCounts(
            @PathVariable @NonNull Integer id,
            @RequestParam Integer numAdults,
            @RequestParam Integer numChildren) {
        tableService.updateActiveReservationGuestCounts(id, numAdults, numChildren);
        return ResponseEntity.ok().build();
    }
}


