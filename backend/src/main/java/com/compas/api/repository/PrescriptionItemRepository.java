package com.compas.api.repository;

import com.compas.api.model.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, UUID> {

    List<PrescriptionItem> findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
            UUID prescriptionId,
            UUID nutritionistId);

    Optional<PrescriptionItem> findByIdAndNutritionistId(
            UUID id,
            UUID nutritionistId);

    void deleteByPrescriptionIdAndNutritionistId(
            UUID prescriptionId,
            UUID nutritionistId);
}
