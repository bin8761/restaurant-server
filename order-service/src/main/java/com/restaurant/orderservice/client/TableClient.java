package com.restaurant.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "table-service", url = "${services.table}")
public interface TableClient {
    
    @GetMapping("/api/tables/{tableId}/validate-key")
    Boolean validateTableKey(@PathVariable("tableId") Integer tableId, @RequestParam("tableKey") String tableKey);

    @PutMapping("/api/tables/{tableId}/status")
    void updateTableStatus(@PathVariable("tableId") Integer tableId, @RequestParam("status") String status, @RequestParam("isBuffet") Boolean isBuffet);

    @PutMapping("/api/tables/{tableId}/keys/invalidate")
    void invalidateTableKey(@PathVariable("tableId") Integer tableId);

    @PutMapping("/api/tables/{tableId}/reservation/guest-counts")
    void updateReservationGuestCounts(
            @PathVariable("tableId") Integer tableId,
            @RequestParam("numAdults") Integer numAdults,
            @RequestParam("numChildren") Integer numChildren);
}
