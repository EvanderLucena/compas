package com.compas.api.repository;

import com.compas.api.model.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, UUID> {

    /**
     * Find plan by episode ID (1:1 relationship per D-13).
     */
    Optional<MealPlan> findByEpisodeId(UUID episodeId);

    /**
     * Find plan by episode ID and nutritionist ID (data isolation).
     */
    Optional<MealPlan> findByEpisodeIdAndNutritionistId(UUID episodeId, UUID nutritionistId);

    /**
     * Find plans by nutritionist ID.
     */
    java.util.List<MealPlan> findByNutritionistId(UUID nutritionistId);
}