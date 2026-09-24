package com.compas.api.dto.substitution;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request payload for smart TACO food substitution calculations.
 */
public record FoodSubstitutionRequest(
        UUID foodId,
        String sourceFoodName,
        @NotNull(message = "A quantidade de referência é obrigatória")
        @DecimalMin(value = "0.1", message = "A quantidade deve ser maior que zero")
        BigDecimal sourceAmount,
        String sourceUnit,
        BigDecimal sourceKcal,
        BigDecimal sourceProt,
        BigDecimal sourceCarb,
        BigDecimal sourceFat,
        String category,
        Integer limit
) {
}
