package com.restaurant.orderservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.math.BigDecimal;

@Data
public class OrderRequest {
    @NotNull(message = "table_id is required")
    private Integer table_id;
    private Integer user_id;
    private String table_key;
    private Boolean is_buffet;
    private BigDecimal buffet_price;
    private String buffet_session_id;
    private Integer buffet_package_id;
    private String buffet_package_name;
    private Integer num_adults;
    private Integer num_children;
    private List<OrderItemDto> items;
}
