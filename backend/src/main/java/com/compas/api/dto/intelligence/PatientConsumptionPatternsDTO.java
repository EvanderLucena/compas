package com.compas.api.dto.intelligence;

import java.util.List;

/**
 * Aggregated consumption patterns and detected off-plan preferences for a patient.
 */
public record PatientConsumptionPatternsDTO(
        int periodDays,
        int totalLoggedMeals,
        double dailyAverageMeals,
        double avgKcalPerMeal,
        double avgProtPerMeal,
        String peakHoursRange,
        List<FrequentOffPlanFoodDTO> frequentOffPlanFoods,
        List<String> observedPatterns
) {
}
