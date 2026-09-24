package com.compas.api.repository;

import com.compas.api.model.Prescription;
import com.compas.api.model.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    List<Prescription> findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(
            UUID patientId,
            UUID nutritionistId);

    Optional<Prescription> findByIdAndNutritionistId(
            UUID id,
            UUID nutritionistId);

    Optional<Prescription> findFirstByPatientIdAndNutritionistIdAndStatusOrderByCreatedAtDesc(
            UUID patientId,
            UUID nutritionistId,
            PrescriptionStatus status);
}
