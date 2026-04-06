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
        Object roleIdAttr = request.getAttribute("roleId");
        if (userIdAttr != null) {
            Integer roleId = roleIdAttr != null ? ((Number) roleIdAttr).intValue() : 0;
            if (roleId == 5) {
                // BUG-020: CUSTOMER — override bằng userId từ JWT, không tin payload
                payload.put("customer_id", ((Number) userIdAttr).intValue());
            }
            // Admin (roleId != 5) có thể đặt customer_id hợp lệ — giữ nguyên
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

    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(@RequestBody @NonNull RestaurantTable table) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createTable(table));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantTable> updateTable(@PathVariable @NonNull Integer id, @RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String status = (String) payload.get("status");
        Boolean isBuffet = payload.containsKey("is_buffet") ? (Boolean) payload.get("is_buffet") : null;
        return ResponseEntity.ok(tableService.updateTable(id, name, status, isBuffet));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable @NonNull Integer id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok().build();
    }

    // Key validation endpoints accessed by other services or directly internally
    @GetMapping("/{id}/validate-key")
    public ResponseEntity<Boolean> validateTableKey(@PathVariable @NonNull Integer id, @RequestParam @NonNull String tableKey, @RequestParam(required = false) String deviceSession) {
        return ResponseEntity.ok(tableService.validateTableKey(id, tableKey, deviceSession));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateTableStatus(@PathVariable @NonNull Integer id, @RequestParam String status, @RequestParam Boolean isBuffet) {
        tableService.updateTable(id, null, status, isBuffet);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/keys/invalidate")
    public ResponseEntity<Void> invalidateKeysExternal(@PathVariable @NonNull Integer id) {
        tableService.invalidateTableKey(id);
        return ResponseEntity.ok().build();
    }
}
