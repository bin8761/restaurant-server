package com.restaurant.menuservice.service;

import com.restaurant.menuservice.client.InventoryClient;
import com.restaurant.menuservice.dto.BuffetPackageDto;
import com.restaurant.menuservice.dto.FoodCreateUpdateDto;
import com.restaurant.menuservice.dto.FoodDto;
import com.restaurant.menuservice.dto.IngredientDto;
import com.restaurant.menuservice.entity.BuffetPackage;
import com.restaurant.menuservice.entity.Category;
import com.restaurant.menuservice.entity.Food;
import com.restaurant.menuservice.entity.FoodIngredient;
import com.restaurant.menuservice.repository.BuffetPackageRepository;
import com.restaurant.menuservice.repository.CategoryRepository;
import com.restaurant.menuservice.repository.FoodIngredientRepository;
import com.restaurant.menuservice.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final FoodRepository foodRepository;
    private final FoodIngredientRepository foodIngredientRepository;
    private final InventoryClient inventoryClient;
    private final BuffetPackageRepository buffetPackageRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(@NonNull Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay danh muc"));
    }

    @Transactional
    public Category createCategory(@NonNull Category category) {
        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(@NonNull Integer id, @NonNull Category category) {
        Category existing = getCategoryById(id);
        existing.setName(category.getName());
        return categoryRepository.save(existing);
    }

    @Transactional
    public void deleteCategory(@NonNull Integer id) {
        if (foodRepository.countByCategoryId(id) > 0) {
            throw new RuntimeException("Khong the xoa danh muc co mon an");
        }
        categoryRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<BuffetPackageDto> getBuffetPackages() {
        return buffetPackageRepository.findAll().stream()
                .map(this::mapPackageToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BuffetPackageDto getBuffetPackageById(@NonNull Integer id) {
        BuffetPackage pkg = buffetPackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay goi buffet"));
        return mapPackageToDto(pkg);
    }

    @Transactional
    public BuffetPackageDto createBuffetPackage(BuffetPackageDto dto) {
        BuffetPackage buffetPackage = new BuffetPackage();
        mapDtoToPackage(dto, buffetPackage);
        return mapPackageToDto(buffetPackageRepository.save(buffetPackage));
    }

    @Transactional
    public BuffetPackageDto updateBuffetPackage(@NonNull Integer id, BuffetPackageDto dto) {
        BuffetPackage existing = buffetPackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay goi buffet"));
        mapDtoToPackage(dto, existing);
        return mapPackageToDto(buffetPackageRepository.save(existing));
    }

    @Transactional
    public void deleteBuffetPackage(@NonNull Integer id) {
        buffetPackageRepository.deleteById(id);
    }

    public List<FoodDto> getFoods(Integer categoryId) {
        List<Food> foods = categoryId != null
                ? foodRepository.findByCategoryId(categoryId)
                : foodRepository.findAll();
        if (foods.isEmpty()) {
            return List.of();
        }

        List<Integer> foodIds = foods.stream()
                .map(Food::getId)
                .collect(Collectors.toList());

        List<FoodIngredient> allFoodIngredients = foodIngredientRepository.findByFoodIdIn(foodIds);
        Map<Integer, List<FoodIngredient>> ingredientsByFoodId = allFoodIngredients.stream()
                .collect(Collectors.groupingBy(FoodIngredient::getFoodId));
        Map<Integer, Map<String, String>> ingredientDetails = resolveIngredientDetails(allFoodIngredients);

        return foods.stream()
                .map(food -> mapFoodToDto(
                        food,
                        ingredientsByFoodId.getOrDefault(food.getId(), List.of()),
                        ingredientDetails))
                .collect(Collectors.toList());
    }

    public FoodDto getFoodById(@NonNull Integer id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay mon an"));
        return mapFoodToDto(food);
    }

    public List<FoodDto> getFoodDetails(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Food> foods = foodRepository.findAllById(ids);
        return foods.stream().map(this::mapFoodToDto).collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    public FoodDto createFood(FoodCreateUpdateDto dto) {
        Food food = new Food();
        food.setName(dto.getName());
        food.setPrice(dto.getPrice());
        food.setImageUrl(dto.getImage_url());

        if (dto.getCategory_id() != null) {
            food.setCategory(getCategoryById(dto.getCategory_id()));
        }
        if (dto.getIs_buffet_eligible() != null) {
            food.setIsBuffetEligible(dto.getIs_buffet_eligible());
        }

        Food savedFood = foodRepository.save(food);

        if (dto.getIngredients() != null && !dto.getIngredients().isEmpty()) {
            for (FoodCreateUpdateDto.IngredientInputDto input : dto.getIngredients()) {
                FoodIngredient fi = new FoodIngredient();
                fi.setFoodId(savedFood.getId());
                fi.setIngredientId(input.getId());
                fi.setAmount(input.getAmount());
                foodIngredientRepository.save(fi);
            }
        }
        return mapFoodToDto(savedFood);
    }

    @Transactional
    @SuppressWarnings("null")
    public FoodDto updateFood(@NonNull Integer id, FoodCreateUpdateDto dto) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay mon an"));

        if (dto.getName() != null) {
            food.setName(dto.getName());
        }
        if (dto.getPrice() != null) {
            food.setPrice(dto.getPrice());
        }
        if (dto.getImage_url() != null) {
            food.setImageUrl(dto.getImage_url());
        }
        if (dto.getCategory_id() != null) {
            food.setCategory(getCategoryById(dto.getCategory_id()));
        }
        if (dto.getIs_buffet_eligible() != null) {
            food.setIsBuffetEligible(dto.getIs_buffet_eligible());
        }

        foodRepository.save(food);

        if (dto.getIngredients() != null) {
            foodIngredientRepository.deleteByFoodId(id);
            for (FoodCreateUpdateDto.IngredientInputDto input : dto.getIngredients()) {
                FoodIngredient fi = new FoodIngredient();
                fi.setFoodId(id);
                fi.setIngredientId(input.getId());
                fi.setAmount(input.getAmount());
                foodIngredientRepository.save(fi);
            }
        }

        return mapFoodToDto(food);
    }

    @Transactional
    public void deleteFood(@NonNull Integer id) {
        foodIngredientRepository.deleteByFoodId(id);
        foodRepository.deleteById(id);
    }

    private FoodDto mapFoodToDto(Food food) {
        List<FoodIngredient> foodIngredients = foodIngredientRepository.findByFoodId(food.getId());
        Map<Integer, Map<String, String>> ingredientDetails = resolveIngredientDetails(foodIngredients);
        return mapFoodToDto(food, foodIngredients, ingredientDetails);
    }

    private FoodDto mapFoodToDto(
            Food food,
            List<FoodIngredient> foodIngredients,
            Map<Integer, Map<String, String>> ingredientDetails) {
        FoodDto dto = new FoodDto();
        dto.setId(food.getId());
        dto.setName(food.getName());
        dto.setPrice(food.getPrice());
        dto.setImageUrl(normalizeImageUrl(food.getImageUrl()));
        if (food.getCategory() != null) {
            dto.setCategoryId(food.getCategory().getId());
            dto.setCategoryName(food.getCategory().getName());
        }
        dto.setIsBuffetEligible(food.getIsBuffetEligible());

        List<IngredientDto> ingredientDtos = new ArrayList<>();
        if (!foodIngredients.isEmpty()) {
            for (FoodIngredient fi : foodIngredients) {
                Map<String, String> details = ingredientDetails.get(fi.getIngredientId());
                String name = details != null ? details.getOrDefault("name", "N/A") : "N/A";
                String unit = details != null ? details.getOrDefault("unit", "N/A") : "N/A";
                ingredientDtos.add(new IngredientDto(fi.getIngredientId(), name, unit, fi.getAmount()));
            }
        }
        dto.setIngredients(ingredientDtos);
        return dto;
    }

    private BuffetPackageDto mapPackageToDto(BuffetPackage pkg) {
        BuffetPackageDto dto = new BuffetPackageDto();
        dto.setId(pkg.getId());
        dto.setName(pkg.getName());
        dto.setPrice(pkg.getPrice());
        dto.setPrice_child(pkg.getPriceChild());
        dto.setDuration_minutes(pkg.getDurationMinutes());
        dto.setDescription(pkg.getDescription());
        if (pkg.getFoods() != null) {
            dto.setFood_ids(pkg.getFoods().stream().map(Food::getId).collect(Collectors.toList()));
            dto.setFoods(pkg.getFoods().stream().map(this::mapFoodToDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private void mapDtoToPackage(BuffetPackageDto dto, BuffetPackage pkg) {
        if (dto.getName() != null) pkg.setName(dto.getName());
        if (dto.getPrice() != null) pkg.setPrice(dto.getPrice());
        if (dto.getPrice_child() != null) pkg.setPriceChild(dto.getPrice_child());
        if (dto.getDuration_minutes() != null) pkg.setDurationMinutes(dto.getDuration_minutes());
        if (dto.getDescription() != null) pkg.setDescription(dto.getDescription());
        
        if (dto.getFood_ids() != null) {
            List<Food> foods = foodRepository.findAllById(dto.getFood_ids());
            pkg.setFoods(foods);
        }
    }

    private String normalizeImageUrl(String rawUrl) {
        if (rawUrl == null) return null;
        String value = rawUrl.trim();
        if (value.isEmpty()) return value;

        if (value.startsWith("/api/images/")) {
            return value;
        }
        if (value.startsWith("/image-service/uploads/")) {
            return "/api/images/" + value.substring("/image-service/uploads/".length());
        }
        if (value.startsWith("/uploads/")) {
            return "/api/images/" + value.substring("/uploads/".length());
        }
        if (value.startsWith("uploads/")) {
            return "/api/images/" + value.substring("uploads/".length());
        }

        int apiImagesIndex = value.indexOf("/api/images/");
        if (apiImagesIndex >= 0) {
            return value.substring(apiImagesIndex);
        }

        int legacyUploadsIndex = value.indexOf("/image-service/uploads/");
        if (legacyUploadsIndex >= 0) {
            String suffix = value.substring(legacyUploadsIndex + "/image-service/uploads/".length());
            return "/api/images/" + suffix;
        }

        int uploadsIndex = value.indexOf("/uploads/");
        if (uploadsIndex >= 0) {
            String suffix = value.substring(uploadsIndex + "/uploads/".length());
            return "/api/images/" + suffix;
        }

        if (!value.contains("/") && value.contains(".")) {
            return "/api/images/foods/" + value;
        }

        return value;
    }

    private Map<Integer, Map<String, String>> resolveIngredientDetails(List<FoodIngredient> foodIngredients) {
        if (foodIngredients == null || foodIngredients.isEmpty()) {
            return Map.of();
        }

        List<Integer> ingredientIds = foodIngredients.stream()
                .map(FoodIngredient::getIngredientId)
                .distinct()
                .collect(Collectors.toList());
        if (ingredientIds.isEmpty()) {
            return Map.of();
        }

        try {
            return inventoryClient.getIngredientDetails(ingredientIds);
        } catch (Exception e) {
            log.warn("Failed to call inventory service while mapping foods", e);
            return Map.of();
        }
    }

    @PostConstruct
    public void seedDefaultBuffetData() {
        try {
            if (buffetPackageRepository.count() == 0) {
                log.info("🌱 Seeding default buffet packages...");
                
                BuffetPackage classic = new BuffetPackage();
                classic.setName("Buffet Classic");
                classic.setPrice(new BigDecimal("299000"));
                classic.setPriceChild(new BigDecimal("149000"));
                classic.setDurationMinutes(120);
                classic.setDescription("Gói Buffet cơ bản với hơn 50 món nướng và lẩu đặc sắc.");
                buffetPackageRepository.save(classic);

                BuffetPackage premium = new BuffetPackage();
                premium.setName("Buffet Premium");
                premium.setPrice(new BigDecimal("499000"));
                premium.setPriceChild(new BigDecimal("249000"));
                premium.setDurationMinutes(180);
                premium.setDescription("Gói Buffet thượng hạng với hải sản tươi sống, bò Wagyu và quầy Line không giới hạn.");
                buffetPackageRepository.save(premium);

                BuffetPackage lunch = new BuffetPackage();
                lunch.setName("Buffet Lunch (T2-T6)");
                lunch.setPrice(new BigDecimal("199000"));
                lunch.setPriceChild(new BigDecimal("99000"));
                lunch.setDurationMinutes(90);
                lunch.setDescription("Gói Buffet trưa tiết kiệm dành cho dân văn phòng và sinh viên.");
                buffetPackageRepository.save(lunch);
                
                log.info("✅ Default buffet packages seeded.");
            }

            // Ensure all foods have a default value for is_buffet_eligible (1/true)
            List<Food> allFoods = foodRepository.findAll();
            boolean updated = false;
            for (Food food : allFoods) {
                if (food.getIsBuffetEligible() == null) {
                    food.setIsBuffetEligible(true);
                    foodRepository.save(food);
                    updated = true;
                }
            }
            if (updated) {
                log.info("✅ Existing foods updated with default buffet eligibility.");
            }
        } catch (Exception e) {
            log.error("❌ Error during buffet data seeding: {}", e.getMessage());
        }
    }
}
