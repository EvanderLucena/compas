package com.compas.api.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Structured meal extraction result from LLM.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExtractionResult(
    String mealLabel,
    List<ExtractionItemResult> items,
    String extractionRaw,
    List<ExtractionResult> meals
) {
    public ExtractionResult(String mealLabel, List<ExtractionItemResult> items, String extractionRaw) {
        this(mealLabel, items, extractionRaw, List.of());
    }

    public List<ExtractionResult> allMeals() {
        if (meals != null && !meals.isEmpty()) {
            return meals;
        }
        if (items != null && !items.isEmpty()) {
            return List.of(this);
        }
        return List.of();
    }
}

