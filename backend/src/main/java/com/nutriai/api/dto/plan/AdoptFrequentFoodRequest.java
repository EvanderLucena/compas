package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

/**
 * Request to complement a meal slot with a frequently consumed off-plan food as an alternative option.
 */
public record AdoptFrequentFoodRequest(
        @NotBlank(message = "Nome do alimento é obrigatório")
        String foodName,
        BigDecimal typicalGrams,
        BigDecimal typicalKcal,
        BigDecimal typicalProt,
        BigDecimal typicalCarb,
        BigDecimal typicalFat
) {
}
