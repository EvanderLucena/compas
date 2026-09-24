package com.compas.api.dto.substitution;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Individual substitution alternative calculated with nutritional equivalence and habit context.
 */
public record FoodSubstitutionItemResponse(
        UUID foodId,
        String name,
        String category,
        String unit,
        BigDecimal suggestedAmount,
        String householdPortion,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        BigDecimal fiber,
        BigDecimal deltaKcal,
        BigDecimal deltaProt,
        BigDecimal deltaCarb,
        BigDecimal deltaFat,
        boolean isPatientHabit,
        int habitCount,
        String habitBadge,
        int matchScore,
        String clinicalReason
) {
}
