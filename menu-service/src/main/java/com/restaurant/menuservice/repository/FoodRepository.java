package com.restaurant.menuservice.repository;

import com.restaurant.menuservice.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Integer> {
    @Override
    @EntityGraph(attributePaths = "category")
    List<Food> findAll();

    @EntityGraph(attributePaths = "category")
    List<Food> findByCategoryId(Integer categoryId);

    long countByCategoryId(Integer categoryId);
}
