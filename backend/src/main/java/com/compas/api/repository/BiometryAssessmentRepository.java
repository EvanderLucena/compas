package com.compas.api.repository;

import com.compas.api.model.BiometryAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BiometryAssessmentRepository extends JpaRepository<BiometryAssessment, UUID> {

    List<BiometryAssessment> findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(
            UUID episodeId,
            UUID nutritionistId);

    List<BiometryAssessment> findByEpisodeIdInAndNutritionistIdOrderByAssessmentDateAsc(
            List<UUID> episodeIds,
            UUID nutritionistId);

    Optional<BiometryAssessment> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    @Query("""
            select a
            from BiometryAssessment a
            where a.episodeId = :episodeId
              and a.patientId = :patientId
              and a.nutritionistId = :nutritionistId
            order by a.assessmentDate asc
            """)
    List<BiometryAssessment> findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
            @Param("episodeId") UUID episodeId,
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("""
            select a
            from BiometryAssessment a
            where a.episodeId in :episodeIds
              and a.patientId = :patientId
              and a.nutritionistId = :nutritionistId
            order by a.assessmentDate asc
            """)
    List<BiometryAssessment> findByEpisodeIdInAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
            @Param("episodeIds") List<UUID> episodeIds,
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);

    @Query("""
            select a
            from BiometryAssessment a
            where a.id = :id
              and a.patientId = :patientId
              and a.nutritionistId = :nutritionistId
            """)
    Optional<BiometryAssessment> findByIdAndPatientIdAndNutritionistId(
            @Param("id") UUID id,
            @Param("patientId") UUID patientId,
            @Param("nutritionistId") UUID nutritionistId);
}
