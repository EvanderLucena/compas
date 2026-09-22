package com.compas.api.repository;

import com.compas.api.model.BiometrySkinfold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiometrySkinfoldRepository extends JpaRepository<BiometrySkinfold, UUID> {

    List<BiometrySkinfold> findByAssessmentIdAndNutritionistIdOrderBySortOrder(UUID assessmentId, UUID nutritionistId);

    List<BiometrySkinfold> findByAssessmentIdInAndNutritionistIdOrderByAssessmentIdAscSortOrderAsc(
            List<UUID> assessmentIds,
            UUID nutritionistId);

    void deleteAllByAssessmentIdAndNutritionistId(UUID assessmentId, UUID nutritionistId);
}
