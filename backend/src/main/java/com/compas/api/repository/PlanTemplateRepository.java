package com.compas.api.repository;

import com.compas.api.model.PlanTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, UUID> {

    @Query("SELECT t FROM PlanTemplate t WHERE t.nutritionistId = :nutritionistId OR t.nutritionistId IS NULL ORDER BY t.isSystem DESC, t.name ASC")
    List<PlanTemplate> findAllByNutritionistIdOrSystem(@Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT t FROM PlanTemplate t WHERE t.id = :id AND (t.nutritionistId = :nutritionistId OR t.nutritionistId IS NULL)")
    Optional<PlanTemplate> findByIdAndNutritionistIdOrSystem(@Param("id") UUID id, @Param("nutritionistId") UUID nutritionistId);

    Optional<PlanTemplate> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    long countByNutritionistId(UUID nutritionistId);
}
