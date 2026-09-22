package com.compas.api.dto.plan;

import com.compas.api.model.MealFood;
import com.compas.api.model.MealOption;
import com.compas.api.model.MealSlot;

import java.util.List;
import java.util.UUID;

/**
 * DTO for a meal slot within a plan.
 */
public record MealSlotResponse(
        UUID id,
        String label,
        String time,
        List<MealOptionResponse> options
) {
    public static MealSlotResponse from(MealSlot slot, List<MealOption> allOptions, List<MealFood> allItems) {
        List<MealOptionResponse> optionResponses = allOptions.stream()
                .filter(o -> o.getMealSlotId().equals(slot.getId()))
                .map(o -> MealOptionResponse.from(o, allItems))
                .toList();
        return new MealSlotResponse(slot.getId(), slot.getLabel(), slot.getTime(), optionResponses);
    }
}