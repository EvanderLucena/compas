package com.compas.api.repository;

import com.compas.api.model.Episode;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    @Query("SELECT e FROM Episode e " +
            "WHERE e.id = :id AND e.patientId = :patientId AND e.nutritionistId = :nutritionistId")
    Optional<Episode> findByIdAndPatientIdAndNutritionistId(
            @Param("id") UUID id,
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT e FROM Episode e " +
            "WHERE e.patientId = :patientId AND e.nutritionistId = :nutritionistId AND e.endDate IS null " +
            "ORDER BY e.startDate DESC")
    List<Episode> findOpenByPatientIdAndNutritionistId(
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId,
            Pageable pageable);

    default Optional<Episode> findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
            UUID patientId,
            UUID nutritionistId) {
        return findOpenByPatientIdAndNutritionistId(patientId, nutritionistId, PageRequest.of(0, 1))
                .stream()
                .findFirst();
    }

    @Query("SELECT e FROM Episode e " +
            "WHERE e.patientId IN :patientIds AND e.nutritionistId = :nutritionistId AND e.endDate IS null " +
            "ORDER BY e.patientId ASC, e.startDate DESC")
    List<Episode> findActiveByPatientIdsAndNutritionistId(
            @Param("patientIds") List<UUID> patientIds,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("SELECT e FROM Episode e " +
            "WHERE e.patientId = :patientId AND e.nutritionistId = :nutritionistId AND e.endDate IS NOT NULL " +
            "ORDER BY e.startDate DESC")
    List<Episode> findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);
}
