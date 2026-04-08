package com.restaurant.menuservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class FoodDto {
    private Integer id;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private Integer categoryId;
    private String categoryName;
    private Boolean isBuffetEligible;
    private List<IngredientDto> ingredients;
}
