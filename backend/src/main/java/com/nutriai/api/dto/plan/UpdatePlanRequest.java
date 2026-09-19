package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * DTO for updating plan-level fields (title, targets, notes).
 */
public record UpdatePlanRequest(
        @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
        String title,

        String notes,

        @DecimalMin(value = "0.0", message = "Meta de calorias não pode ser negativa")
        BigDecimal kcalTarget,

        @DecimalMin(value = "0.0", message = "Meta de proteína não pode ser negativa")
        BigDecimal protTarget,

        @DecimalMin(value = "0.0", message = "Meta de carboidrato não pode ser negativa")
        BigDecimal carbTarget,

        @DecimalMin(value = "0.0", message = "Meta de gordura não pode ser negativa")
        BigDecimal fatTarget
) {}