package com.nutriai.api.dto.nutritionist;

import java.time.LocalDateTime;
import java.util.UUID;

public record NutritionistProfileResponse(
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
) {}
