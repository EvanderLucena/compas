package com.compas.api.dto.whatsapp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;

/**
 * Request body for PATCH extraction correction.
 */
public record PatchExtractionRequest(
    List<PatchExtractionItem> items
) {
    public PatchExtractionRequest {
        items = items != null ? List.copyOf(items) : List.of();
    }

    /**
     * Individual item in a correction request.
     */
    public record PatchExtractionItem(
        @NotBlank String name,
        @NotNull @PositiveOrZero BigDecimal kcal,
        @NotNull @PositiveOrZero BigDecimal prot,
        @NotNull @PositiveOrZero BigDecimal carb,
        @NotNull @PositiveOrZero BigDecimal fat,
        @NotNull @PositiveOrZero BigDecimal grams
    ) {}
}
