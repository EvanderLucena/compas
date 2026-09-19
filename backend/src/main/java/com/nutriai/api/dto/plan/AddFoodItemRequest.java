package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddFoodItemRequest(
        @NotNull(message = "foodId é obrigatório")
        UUID foodId,

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.01", message = "Quantidade deve ser maior que zero")
        @DecimalMax(value = "5000.0", message = "Quantidade deve ser no máximo 5000")
        BigDecimal referenceAmount
) {}