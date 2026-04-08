package com.restaurant.menuservice.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
public class FoodCreateUpdateDto {
    @NotNull(message = "Tên món ăn là bắt buộc")
    private String name;
    
    @NotNull(message = "Giá món ăn là bắt buộc")
    private BigDecimal price;
    
    private String image_url;
    private Integer category_id;
    private Boolean is_buffet_eligible;
    private List<IngredientInputDto> ingredients;
    
    @Data
    public static class IngredientInputDto {
        private Integer id;
        private BigDecimal amount;
    }
}
