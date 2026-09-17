package com.nutriai.api.dto.food;

import com.nutriai.api.model.Food;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record FoodResponse(
        UUID id,
        String name,
        String category,
        String unit,
        BigDecimal referenceAmount,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        BigDecimal fiber,
        String prep,
        String portionLabel,
        Integer usedCount,
        Boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static FoodResponse from(Food food) {
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getCategory(),
                food.getUnit(),
                food.getReferenceAmount(),
                food.getKcal(),
                food.getProt(),
                food.getCarb(),
                food.getFat(),
                food.getFiber(),
                food.getPrep(),
                food.getPortionLabel(),
                food.getUsedCount(),
                food.getNutritionistId() != null,
                food.getCreatedAt(),
                food.getUpdatedAt()
        );
    }
}