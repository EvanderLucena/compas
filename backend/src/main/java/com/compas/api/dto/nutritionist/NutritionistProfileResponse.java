package com.compas.api.dto.nutritionist;

import com.compas.api.model.Nutritionist;

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
        LocalDateTime createdAt,
        Boolean subscriptionActive,
        Boolean readOnly
) {
    public NutritionistProfileResponse(
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
        this(id, name, professionalName, email, role, crn, crnRegional, specialty, whatsapp,
                emailVerified, onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit,
                activePatientCount, createdAt,
                Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt),
                !Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt));
    }

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
                onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit, activePatientCount, createdAt,
                Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt),
                !Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt));
    }
}
