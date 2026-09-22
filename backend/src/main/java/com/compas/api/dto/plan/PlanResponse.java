package com.compas.api.dto.plan;

import com.compas.api.model.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full meal plan response with nested meals, options, items, and extras.
 */
public record PlanResponse(
        UUID id,
        UUID episodeId,
        String title,
        String notes,
        BigDecimal kcalTarget,
        BigDecimal protTarget,
        BigDecimal carbTarget,
        BigDecimal fatTarget,
        List<MealSlotResponse> meals,
        List<ExtraResponse> extras,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PlanResponse from(MealPlan plan, List<MealSlot> slots, List<PlanExtra> extras,
                                     List<MealOption> options, List<MealFood> items) {
        return new PlanResponse(
                plan.getId(),
                plan.getEpisodeId(),
                plan.getTitle(),
                plan.getNotes(),
                plan.getKcalTarget(),
                plan.getProtTarget(),
                plan.getCarbTarget(),
                plan.getFatTarget(),
                slots.stream().map(slot -> MealSlotResponse.from(slot, options, items)).toList(),
                extras.stream().map(ExtraResponse::from).toList(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}