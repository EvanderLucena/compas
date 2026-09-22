package com.compas.api.repository;

import com.compas.api.model.MealExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealExtractionRepository extends JpaRepository<MealExtraction, UUID> {

    /**
     * Find extractions by patient scoped by nutritionist within date range (tenant isolation, D-14).
     */
    List<MealExtraction> findByPatientIdAndNutritionistIdAndExtractedAtBetween(
            UUID patientId,
            UUID nutritionistId,
            LocalDateTime start,
            LocalDateTime end);

    /**
     * Find extraction by ID scoped to patient (for correction PATCH, D-12).
     */
    Optional<MealExtraction> findByIdAndPatientId(UUID id, UUID patientId);

    /**
     * Find extraction by ID scoped to patient and nutritionist (defense-in-depth tenant isolation, D-12).
     */
    Optional<MealExtraction> findByIdAndPatientIdAndNutritionistId(UUID id, UUID patientId, UUID nutritionistId);

    /**
     * Count extractions for a nutritionist today (for WhatsApp status, D-23).
     */
    long countByNutritionistIdAndExtractedAtBetween(
            UUID nutritionistId,
            LocalDateTime start,
            LocalDateTime end);

    /**
     * Find the most recent extraction for a patient within a time cutoff (for meal consolidation/deduplication).
     */
    Optional<MealExtraction> findFirstByPatientIdAndNutritionistIdAndExtractedAtAfterOrderByExtractedAtDesc(
            UUID patientId,
            UUID nutritionistId,
            LocalDateTime after);
}