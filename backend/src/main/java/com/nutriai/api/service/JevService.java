package com.nutriai.api.service;

import com.nutriai.api.dto.jev.*;

import java.util.List;

/**
 * Interface for System 1 high-speed decision and intent evaluation via TypeSafe Jev AI.
 */
public interface JevService {

    /**
     * Indicates whether Jev AI is configured, enabled, and available.
     */
    boolean isAvailable();

    /**
     * Evaluates a patient message to extract intent, emotional sentiment,
     * and human attention requirement.
     *
     * @param messageText Raw text sent by the patient (or transcribed from audio)
     * @return Typed JevDecision, or fallback decision on error or unavailability
     */
    JevDecision analyzePatientMessage(String messageText);

    /**
     * Clinical Sanity Gate: Validates whether extracted meal portions and calories are realistic.
     */
    JevMealSanityDecision validateMealSanity(String userText, String mealLabel, double totalKcal, double totalGrams, List<String> itemNames);

    /**
     * Safety Shield: Evaluates food substitution requests against clinical diet principles.
     */
    JevSubstitutionDecision evaluateSubstitution(String prescribedFood, String desiredFood, String patientObjective);

    /**
     * Adherence Predictor: Evaluates a patient's recent activity to detect attrition risk.
     */
    JevAdherenceDecision evaluatePatientAdherence(String patientName, String objective, String recentSummary);

    /**
     * Smart Catalog: Automatically classifies food group, unit, and portion from food name.
     */
    JevFoodCategorizationDecision categorizeFood(String foodName);
}
