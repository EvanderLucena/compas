package com.compas.api.dto.plan;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for adding a new meal slot to a plan.
 */
public record AddMealSlotRequest(
        @NotBlank(message = "label é obrigatório")
        String label,
        String time
) {}