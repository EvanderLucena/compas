package com.compas.api.dto.nutritionist;

import java.time.LocalDateTime;
import java.util.UUID;

public record NutritionistProfileResponse(
        UUID id,
        String name,
        String professionalName,
        String email,
        String role,
        String crn,
        String crnRegional,
        String specialty,
        String whatsapp,
        Boolean emailVerified,
        Boolean onboardingCompleted,
        LocalDateTime trialEndsAt,
        String subscriptionTier,
        Integer patientLimit,
        long activePatientCount,
        LocalDateTime createdAt
) {
    public NutritionistProfileResponse(
            UUID id,
            String name,
            String email,
            String role,
            String crn,
            String crnRegional,
            String specialty,
            String whatsapp,
            Boolean onboardingCompleted,
            LocalDateTime trialEndsAt,
            String subscriptionTier,
            Integer patientLimit,
            long activePatientCount,
            LocalDateTime createdAt
    ) {
        this(id, name, null, email, role, crn, crnRegional, specialty, whatsapp, false,
                onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit, activePatientCount, createdAt);
    }
}
