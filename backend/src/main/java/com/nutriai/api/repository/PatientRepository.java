package com.nutriai.api.repository;

import com.nutriai.api.model.Patient;
import com.nutriai.api.model.PatientObjective;
import com.nutriai.api.model.PatientStatus;
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
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) ESCAPE '!') " +
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
}
