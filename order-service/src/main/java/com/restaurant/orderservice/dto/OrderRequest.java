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

    // Explicit getters/setters to avoid Lombok/accessor mismatch on snake_case fields during CI builds
    public Integer getTable_id() { return table_id; }
    public void setTable_id(Integer table_id) { this.table_id = table_id; }

    public Integer getUser_id() { return user_id; }
    public void setUser_id(Integer user_id) { this.user_id = user_id; }

    public String getTable_key() { return table_key; }
    public void setTable_key(String table_key) { this.table_key = table_key; }

    public Boolean getIs_buffet() { return is_buffet; }
    public void setIs_buffet(Boolean is_buffet) { this.is_buffet = is_buffet; }

    public BigDecimal getBuffet_price() { return buffet_price; }
    public void setBuffet_price(BigDecimal buffet_price) { this.buffet_price = buffet_price; }

    public String getBuffet_session_id() { return buffet_session_id; }
    public void setBuffet_session_id(String buffet_session_id) { this.buffet_session_id = buffet_session_id; }

    public Integer getBuffet_package_id() { return buffet_package_id; }
    public void setBuffet_package_id(Integer buffet_package_id) { this.buffet_package_id = buffet_package_id; }

    public String getBuffet_package_name() { return buffet_package_name; }
    public void setBuffet_package_name(String buffet_package_name) { this.buffet_package_name = buffet_package_name; }

    public Integer getNum_adults() { return num_adults; }
    public void setNum_adults(Integer num_adults) { this.num_adults = num_adults; }

    public Integer getNum_children() { return num_children; }
    public void setNum_children(Integer num_children) { this.num_children = num_children; }

    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}
