package com.compas.api.repository;

import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.model.PatientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {

    /**
     * Paginated list of patients for a nutritionist (D-15).
     */
    Page<Patient> findByNutritionistId(UUID nutritionistId, Pageable pageable);

    /**
     * Non-paginated list for aggregate computations (dashboard KPIs).
     */
    List<Patient> findAllByNutritionistId(UUID nutritionistId);

    /**
     * Active/inactive filter (D-06).
     */
    Page<Patient> findByNutritionistIdAndActive(UUID nutritionistId, Boolean active, Pageable pageable);

    /**
     * Count active patients for subscription limit enforcement.
     */
    long countByNutritionistIdAndActiveTrue(UUID nutritionistId);

    /**
     * Status filter (D-02, D-03).
     */
    List<Patient> findByNutritionistIdAndStatus(UUID nutritionistId, PatientStatus status);

    /**
     * Data isolation: always scope by nutritionistId (D-04, D-10, D-11).
     * Returns empty for wrong nutritionist — prevents ID leakage.
     */
    Optional<Patient> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    /**
     * Combined filter query with name search (case-insensitive LIKE) + status + active (D-13).
     */
    @Query("SELECT p FROM Patient p WHERE p.nutritionistId = :nutritionistId " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) ESCAPE '!') " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:objective IS NULL OR p.objective = :objective) " +
           "AND (:active IS NULL OR p.active = :active)")
    Page<Patient> findByNutritionistIdWithFilters(
            @Param("nutritionistId") UUID nutritionistId,
            @Param("search") String search,
            @Param("status") PatientStatus status,
            @Param("objective") PatientObjective objective,
            @Param("active") Boolean active,
            Pageable pageable
    );
    /**
     * Resolve a patient WhatsApp number only within a known tenant scope.
     */
    Optional<Patient> findByWhatsappAndNutritionistId(String whatsapp, UUID nutritionistId);

    /**
     * Discover which tenant(s) own a WhatsApp number without materializing patient rows.
     */
    @Query("SELECT DISTINCT p.nutritionistId FROM Patient p WHERE p.whatsapp = :whatsapp")
    List<UUID> findDistinctNutritionistIdsByWhatsapp(@Param("whatsapp") String whatsapp);

    /**
     * Count active patients assigned to a WhatsApp fleet instance.
     */
    long countByWhatsappInstanceIdAndActiveTrue(UUID instanceId);

    /**
     * Count distinct nutritionists with active patients on a WhatsApp fleet instance.
     */
    @Query("SELECT COUNT(DISTINCT p.nutritionistId) FROM Patient p WHERE p.whatsappInstanceId = :instanceId AND p.active = true")
    long countDistinctNutritionistIdsByWhatsappInstanceId(@Param("instanceId") UUID instanceId);

    /**
     * Paginated list of active patients assigned to an instance.
     */
    Page<Patient> findByWhatsappInstanceIdAndActiveTrue(UUID instanceId, Pageable pageable);

    /**
     * Reassign patients from one fleet instance to another, with optional nutritionist scope.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Patient p SET p.whatsappInstanceId = :targetInstanceId WHERE p.whatsappInstanceId = :sourceInstanceId AND (:nutritionistId IS NULL OR p.nutritionistId = :nutritionistId)")
    int reassignPatients(
            @Param("sourceInstanceId") UUID sourceInstanceId,
            @Param("targetInstanceId") UUID targetInstanceId,
            @Param("nutritionistId") UUID nutritionistId);

    /**
     * Clear instance assignment from patients when an instance is removed, with optional nutritionist scope.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Patient p SET p.whatsappInstanceId = NULL WHERE p.whatsappInstanceId = :instanceId AND (:nutritionistId IS NULL OR p.nutritionistId = :nutritionistId)")
    int clearInstanceFromPatients(
            @Param("instanceId") UUID instanceId,
            @Param("nutritionistId") UUID nutritionistId);
}
