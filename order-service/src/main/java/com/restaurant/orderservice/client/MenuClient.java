package com.restaurant.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@FeignClient(name = "menu-service", url = "${services.menu}")
public interface MenuClient {

    @GetMapping("/api/foods/prices")
    Map<Integer, BigDecimal> getFoodPrices(@RequestParam("foodIds") List<Integer> foodIds);

    @GetMapping("/api/foods/names")
    Map<Integer, String> getFoodNames(@RequestParam("foodIds") List<Integer> foodIds);

    /** BUG-030: Lấy danh sách nguyên liệu cần dùng theo từng foodId. */
    @GetMapping("/api/foods/ingredients")
    Map<Integer, List<Map<String, Object>>> getFoodIngredients(@RequestParam("foodIds") List<Integer> foodIds);

    @GetMapping("/api/menu/foods/details")
    List<Map<String, Object>> getFoodDetails(@RequestParam("ids") List<Integer> ids);

    @GetMapping("/api/menu/buffet-packages/{id}")
    Map<String, Object> getBuffetPackageById(@PathVariable("id") Integer id);
}
