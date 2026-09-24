package com.compas.api.dto.plantemplate;

import java.math.BigDecimal;

public record PlanTemplateExtraDto(
        String name,
        String quantity,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat,
        Integer sortOrder
) {}
