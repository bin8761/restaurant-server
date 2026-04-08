package com.restaurant.orderservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderSessionSummaryDto {
    private Integer representative_order_id;
    private Integer table_id;
    private String table_key;
    private Integer total_orders;
    private Integer total_items;
    private BigDecimal total_amount;
    private String status;
    private String payment_status;
    private Boolean buffet_active;
    private String buffet_package_name;
    private LocalDateTime buffet_expiry_time;
    private Integer num_adults;
    private Integer num_children;
    private Long seconds_remaining;
    private LocalDateTime last_order_time;
}
