package com.restaurant.menuservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BuffetPackageDto {
    private Integer id;
    private String name;
    private BigDecimal price;
    private BigDecimal price_child;
    private Integer duration_minutes;
    private String description;
    private List<Integer> food_ids;
    private List<FoodDto> foods;
}
