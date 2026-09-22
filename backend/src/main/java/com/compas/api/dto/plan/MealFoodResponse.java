package com.compas.api.dto.plan;

import com.compas.api.model.MealFood;

import java.math.BigDecimal;
import java.util.UUID;

public record MealFoodResponse(
        UUID id,
        UUID foodId,
        String foodName,
        BigDecimal referenceAmount,
        String unit,
        String prep,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {
    public static MealFoodResponse from(MealFood item) {
        return new MealFoodResponse(
                item.getId(),
                item.getFoodId(),
                item.getFoodName(),
                item.getReferenceAmount(),
                item.getUnit(),
                item.getPrep(),
                item.getKcal(),
                item.getProt(),
                item.getCarb(),
                item.getFat()
        );
    }
}