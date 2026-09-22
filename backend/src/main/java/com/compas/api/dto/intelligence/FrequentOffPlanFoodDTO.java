package com.compas.api.dto.intelligence;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO representing an off-plan food frequently consumed by a patient.
 */
public record FrequentOffPlanFoodDTO(
        String foodName,
        int consumptionCount,
        String commonMealLabel,
        UUID mealSlotId,
        BigDecimal typicalGrams,
        BigDecimal typicalKcal,
        BigDecimal typicalProt,
        BigDecimal typicalCarb,
        BigDecimal typicalFat,
        String category,
        String clinicalRationale,
        boolean sameGroup,
        String verdict
) {
}
