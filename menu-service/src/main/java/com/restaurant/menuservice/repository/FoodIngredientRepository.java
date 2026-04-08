package com.restaurant.menuservice.repository;

import com.restaurant.menuservice.entity.FoodIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoodIngredientRepository extends JpaRepository<FoodIngredient, Integer> {
    List<FoodIngredient> findByFoodId(Integer foodId);
    List<FoodIngredient> findByFoodIdIn(List<Integer> foodIds);
    void deleteByFoodId(Integer foodId);
}
