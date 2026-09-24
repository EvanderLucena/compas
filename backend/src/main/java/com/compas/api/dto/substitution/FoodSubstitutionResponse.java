package com.compas.api.dto.substitution;

import java.math.BigDecimal;
import java.util.List;

/**
 * Complete smart substitution response for a meal item.
 */
public record FoodSubstitutionResponse(
        String sourceFoodName,
        BigDecimal sourceAmount,
        String sourceUnit,
        BigDecimal sourceKcal,
        BigDecimal sourceProt,
        BigDecimal sourceCarb,
        BigDecimal sourceFat,
        String dominantMacro,
        List<FoodSubstitutionItemResponse> substitutions,
        String whatsappMessage
) {
}
