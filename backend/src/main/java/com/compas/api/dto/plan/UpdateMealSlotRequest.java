package com.compas.api.dto.plan;

public record UpdateMealSlotRequest(
        String label,
        String time
) {}