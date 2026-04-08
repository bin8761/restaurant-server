package com.restaurant.menuservice.controller;

import com.restaurant.menuservice.dto.FoodCreateUpdateDto;
import com.restaurant.menuservice.dto.FoodDto;
import com.restaurant.menuservice.entity.Category;
import com.restaurant.menuservice.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.lang.NonNull;
import com.restaurant.menuservice.entity.BuffetPackage;
import com.restaurant.menuservice.dto.BuffetPackageDto;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    // Categories
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable @NonNull Integer id) {
        return ResponseEntity.ok(menuService.getCategoryById(id));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        if (category.getName() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createCategory(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable @NonNull Integer id, @RequestBody Category category) {
        if (category.getName() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(menuService.updateCategory(id, category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable @NonNull Integer id) {
        menuService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/buffet-packages")
    public ResponseEntity<List<BuffetPackageDto>> getBuffetPackages() {
        return ResponseEntity.ok(menuService.getBuffetPackages());
    }

    @GetMapping("/buffet-packages/{id}")
    public ResponseEntity<BuffetPackageDto> getBuffetPackageById(@PathVariable @NonNull Integer id) {
        return ResponseEntity.ok(menuService.getBuffetPackageById(id));
    }

    @PostMapping("/buffet-packages")
    public ResponseEntity<BuffetPackageDto> createBuffetPackage(@RequestBody BuffetPackageDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createBuffetPackage(dto));
    }

    @PutMapping("/buffet-packages/{id}")
    public ResponseEntity<BuffetPackageDto> updateBuffetPackage(@PathVariable @NonNull Integer id, @RequestBody BuffetPackageDto dto) {
        return ResponseEntity.ok(menuService.updateBuffetPackage(id, dto));
    }

    @DeleteMapping("/buffet-packages/{id}")
    public ResponseEntity<Void> deleteBuffetPackage(@PathVariable @NonNull Integer id) {
        menuService.deleteBuffetPackage(id);
        return ResponseEntity.ok().build();
    }

    // Foods
    @GetMapping("/foods")
    public ResponseEntity<List<FoodDto>> getFoods(@RequestParam(required = false) Integer category_id) {
        return ResponseEntity.ok(menuService.getFoods(category_id));
    }

    @GetMapping("/foods/{id}")
    public ResponseEntity<FoodDto> getFoodById(@PathVariable @NonNull Integer id) {
        return ResponseEntity.ok(menuService.getFoodById(id));
    }

    @GetMapping("/foods/details")
    public ResponseEntity<List<FoodDto>> getFoodDetails(@RequestParam List<Integer> ids) {
        return ResponseEntity.ok(menuService.getFoodDetails(ids));
    }

    @PostMapping("/foods")
    public ResponseEntity<FoodDto> createFood(@Valid @RequestBody FoodCreateUpdateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createFood(dto));
    }

    @PutMapping("/foods/{id}")
    public ResponseEntity<FoodDto> updateFood(@PathVariable @NonNull Integer id, @Valid @RequestBody FoodCreateUpdateDto dto) {
        return ResponseEntity.ok(menuService.updateFood(id, dto));
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable @NonNull Integer id) {
        menuService.deleteFood(id);
        return ResponseEntity.ok().build();
    }
}
