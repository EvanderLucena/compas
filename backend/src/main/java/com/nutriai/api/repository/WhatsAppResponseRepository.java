package com.nutriai.api.repository;

import com.nutriai.api.model.WhatsAppResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WhatsAppResponseRepository extends JpaRepository<WhatsAppResponse, UUID> {

    /**
     * Find responses for a patient scoped by nutritionist (tenant isolation, D-14).
     */
    List<WhatsAppResponse> findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(UUID patientId, UUID nutritionistId);

    /**
     * Find responses for a specific message scoped by nutritionist (tenant isolation).
     */
    List<WhatsAppResponse> findByMessageIdAndNutritionistId(UUID messageId, UUID nutritionistId);
}