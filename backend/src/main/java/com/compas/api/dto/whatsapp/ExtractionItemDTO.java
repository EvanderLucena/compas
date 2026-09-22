package com.compas.api.dto.whatsapp;

import java.math.BigDecimal;

/**
 * DTO for individual food items in an extraction.
 */
public record ExtractionItemDTO(
    String name,
    BigDecimal kcal,
    BigDecimal prot,
    BigDecimal carb,
    BigDecimal fat,
    BigDecimal grams,
    int sortOrder
) {}
