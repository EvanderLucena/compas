package com.compas.api.dto.plan;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * DTO for updating an off-plan extra.
 */
public record UpdateExtraRequest(
        @Size(min = 1, max = 150, message = "Nome deve ter entre 1 e 150 caracteres")
        String name,

        @Size(max = 50, message = "Quantidade deve ter no máximo 50 caracteres")
        String quantity,

        @DecimalMin(value = "0.0", message = "Kcal não pode ser negativo")
        BigDecimal kcal,

        @DecimalMin(value = "0.0", message = "Proteína não pode ser negativa")
        BigDecimal prot,

        @DecimalMin(value = "0.0", message = "Carboidrato não pode ser negativo")
        BigDecimal carb,

        @DecimalMin(value = "0.0", message = "Gordura não pode ser negativa")
        BigDecimal fat
) {}