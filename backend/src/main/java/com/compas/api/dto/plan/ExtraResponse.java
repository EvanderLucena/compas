package com.compas.api.dto.plan;

import com.compas.api.model.PlanExtra;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for an off-plan extra authorization.
 */
public record ExtraResponse(
        UUID id,
        String name,
        String quantity,
        BigDecimal kcal,
        BigDecimal prot,
        BigDecimal carb,
        BigDecimal fat
) {
    public static ExtraResponse from(PlanExtra extra) {
        return new ExtraResponse(
                extra.getId(),
                extra.getName(),
                extra.getQuantity(),
                extra.getKcal(),
                extra.getProt(),
                extra.getCarb(),
                extra.getFat()
        );
    }
}