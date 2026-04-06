package com.restaurant.menuservice.controller;

import com.restaurant.menuservice.entity.Food;
import com.restaurant.menuservice.entity.FoodIngredient;
import com.restaurant.menuservice.repository.FoodIngredientRepository;
import com.restaurant.menuservice.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class InternalMenuController {

    private final FoodRepository foodRepository;
    private final FoodIngredientRepository foodIngredientRepository;

    @GetMapping("/prices")
    public Map<Integer, BigDecimal> getFoodPrices(@RequestParam @NonNull List<Integer> foodIds) {
        List<Food> foods = foodRepository.findAllById(foodIds);
        Map<Integer, BigDecimal> prices = new HashMap<>();
        for (Food food : foods) {
            prices.put(food.getId(), food.getPrice());
        }
        return prices;
    }

    @GetMapping("/names")
    public Map<Integer, String> getFoodNames(@RequestParam @NonNull List<Integer> foodIds) {
        List<Food> foods = foodRepository.findAllById(foodIds);
        Map<Integer, String> names = new HashMap<>();
        for (Food food : foods) {
            names.put(food.getId(), food.getName());
        }
        return names;
    }

    /**
     * BUG-030: Trả về danh sách nguyên liệu cần dùng cho mỗi food.
     * order-service gọi để tính lượng cần trừ kho khi confirm order.
     * Kết quả: { foodId → [ {ingredient_id, amount} ] }
     */
    @GetMapping("/ingredients")
    public Map<Integer, List<Map<String, Object>>> getFoodIngredients(
            @RequestParam @NonNull List<Integer> foodIds) {
        Map<Integer, List<Map<String, Object>>> result = new HashMap<>();
        for (Integer foodId : foodIds) {
            List<FoodIngredient> rows = foodIngredientRepository.findByFoodId(foodId);
            List<Map<String, Object>> ingredients = new ArrayList<>();
            for (FoodIngredient row : rows) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("ingredient_id", row.getIngredientId());
                entry.put("amount", row.getAmount());
                ingredients.add(entry);
            }
            result.put(foodId, ingredients);
        }
        return result;
    }
}
