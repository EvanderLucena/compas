package com.compas.api.service;

import com.compas.api.dto.food.*;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.Food;
import com.compas.api.repository.FoodRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class FoodService {

    private static final Logger logger = LoggerFactory.getLogger(FoodService.class);

    private static final Set<String> VALID_UNITS = Set.of("GRAMAS", "UNIDADE", "ML");
    private static final Set<String> VALID_CATEGORIES = Set.of(
            "PROTEINA", "CARBOIDRATO", "GORDURA", "VEGETAL", "FRUTA", "BEBIDA", "OUTRO"
    );

    private final FoodRepository foodRepository;
    private final JevService jevService;

    public FoodService(FoodRepository foodRepository, JevService jevService) {
        this.foodRepository = foodRepository;
        this.jevService = jevService;
    }

    @Transactional(readOnly = true)
    public com.compas.api.dto.jev.JevFoodCategorizationDecision suggestFoodCategorization(String foodName) {
        if (foodName == null || foodName.isBlank() || jevService == null || !jevService.isAvailable()) {
            return com.compas.api.dto.jev.JevFoodCategorizationDecision.fallback();
        }
        return jevService.categorizeFood(foodName.trim());
    }

    @Transactional
    public FoodResponse createFood(UUID nutritionistId, CreateFoodRequest req) {
        validateUnit(req.unit());
        validateCategory(req.category());

        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .name(req.name())
                .category(req.category() != null ? req.category().toUpperCase() : null)
                .unit(req.unit().toUpperCase())
                .referenceAmount(req.referenceAmount())
                .kcal(req.kcal())
                .prot(req.prot())
                .carb(req.carb())
                .fat(req.fat())
                .fiber(req.fiber())
                .prep(req.prep())
                .portionLabel(req.portionLabel())
                .build();

        Food saved = foodRepository.save(food);

        logger.info("Food created: id={}, name={}, unit={}, nutritionistId={}", saved.getId(), saved.getName(), saved.getUnit(), nutritionistId);
        return FoodResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public FoodListResponse listFoods(UUID nutritionistId, int page, int size, String search, String category) {
        PageRequest pageRequest = PageRequest.of(page, size);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;

        String escapedSearch = cleanSearch != null ? escapeLike(cleanSearch) : null;
        String upperCategory = cleanCategory != null ? cleanCategory.toUpperCase() : null;
        boolean hasFilter = escapedSearch != null || upperCategory != null;

        Page<Food> result;
        if (hasFilter) {
            result = foodRepository.findAvailableByNutritionistIdWithFilters(nutritionistId, escapedSearch, upperCategory, pageRequest);
        } else {
            result = foodRepository.findAvailableByNutritionistId(nutritionistId, pageRequest);
        }

        return FoodListResponse.from(result);
    }

    @Transactional(readOnly = true)
    public FoodResponse getFood(UUID nutritionistId, UUID foodId) {
        Food food = foodRepository.findAvailableById(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));
        return FoodResponse.from(food);
    }

    @Transactional
    public FoodResponse updateFood(UUID nutritionistId, UUID foodId, UpdateFoodRequest req) {
        Food food = foodRepository.findAvailableById(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));

        if (food.getNutritionistId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Alimentos da tabela TACO são padrão do sistema e não podem ser alterados.");
        }

        if (req.name() != null) food.setName(req.name());
        if (req.category() != null) {
            validateCategory(req.category());
            food.setCategory(req.category().toUpperCase());
        }
        if (req.unit() != null) {
            validateUnit(req.unit());
            food.setUnit(req.unit().toUpperCase());
        }
        if (req.referenceAmount() != null) food.setReferenceAmount(req.referenceAmount());
        if (req.kcal() != null) food.setKcal(req.kcal());
        if (req.prot() != null) food.setProt(req.prot());
        if (req.carb() != null) food.setCarb(req.carb());
        if (req.fat() != null) food.setFat(req.fat());
        if (req.fiber() != null) food.setFiber(req.fiber());
        if (req.prep() != null) food.setPrep(req.prep());
        if (req.portionLabel() != null) food.setPortionLabel(req.portionLabel());

        Food saved = foodRepository.save(food);

        logger.info("Food updated: id={}, nutritionistId={}", saved.getId(), nutritionistId);
        return FoodResponse.from(saved);
    }

    @Transactional
    public void deleteFood(UUID nutritionistId, UUID foodId) {
        Food food = foodRepository.findAvailableById(foodId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", foodId));

        if (food.getNutritionistId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Alimentos da tabela TACO são padrão do sistema e não podem ser excluídos.");
        }

        foodRepository.delete(food);
        logger.info("Food deleted: id={}, nutritionistId={}", foodId, nutritionistId);
    }

    private void validateUnit(String unit) {
        if (unit == null || !VALID_UNITS.contains(unit.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unidade inválida. Valores permitidos: " + VALID_UNITS);
        }
    }

    private void validateCategory(String category) {
        if (category != null && !VALID_CATEGORIES.contains(category.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Categoria inválida. Valores permitidos: " + VALID_CATEGORIES);
        }
    }

    private String escapeLike(String search) {
        if (search == null) return null;
        return search.replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    public record FoodListResponse(
            List<FoodResponse> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
        public static FoodListResponse from(Page<Food> pageResult) {
            return new FoodListResponse(
                    pageResult.getContent().stream()
                            .map(FoodResponse::from)
                            .toList(),
                    pageResult.getNumber(),
                    pageResult.getSize(),
                    pageResult.getTotalElements(),
                    pageResult.getTotalPages()
            );
        }
    }
}