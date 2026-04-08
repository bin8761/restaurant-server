package com.restaurant.orderservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponseDto {
    private Integer id;
    private Integer table_id;
    private Integer user_id;
    private String table_key;
    private LocalDateTime order_time;
    private LocalDateTime created_at;
    private String status;
    private BigDecimal total;
    private Boolean is_buffet;
    private String buffet_session_id;
    private Integer buffet_package_id;
    private String buffet_package_name;
    private Integer num_adults;
    private Integer num_children;
    private LocalDateTime buffet_expiry_time;
    private String payment_status;
    private LocalDateTime updated_at;
    private List<OrderDetailResponseDto> details;
    private List<OrderDetailResponseDto> items;
}
