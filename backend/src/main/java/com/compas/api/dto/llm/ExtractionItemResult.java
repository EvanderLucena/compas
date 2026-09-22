package com.compas.api.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Individual extracted food item.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExtractionItemResult(
    String name,
    Double grams,
    double kcal,
    double prot,
    double carb,
    double fat
) {}
