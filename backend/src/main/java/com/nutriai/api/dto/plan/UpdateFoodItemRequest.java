package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateFoodItemRequest(
        @DecimalMin(value = "0.01", message = "Quantidade deve ser maior que zero")
        @DecimalMax(value = "5000.0", message = "Quantidade deve ser no máximo 5000")
        BigDecimal referenceAmount,

        @Size(max = 100, message = "Modo de preparo deve ter no máximo 100 caracteres")
        String prep,

        @DecimalMin(value = "0.0", message = "Kcal não pode ser negativo")
        BigDecimal kcal,

        @DecimalMin(value = "0.0", message = "Proteína não pode ser negativa")
        BigDecimal prot,

        @DecimalMin(value = "0.0", message = "Carboidrato não pode ser negativo")
        BigDecimal carb,

        @DecimalMin(value = "0.0", message = "Gordura não pode ser negativa")
        BigDecimal fat
) {}