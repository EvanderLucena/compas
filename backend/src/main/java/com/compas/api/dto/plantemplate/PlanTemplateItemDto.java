package com.compas.api.dto.plantemplate;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanTemplateItemDto(
        UUID foodId,
        String foodName,
        BigDecimal referenceAmount,
        String unit,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        String prep,
        Integer sortOrder
) {}
