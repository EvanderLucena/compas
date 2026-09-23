package com.compas.api.auth.dto;

import com.compas.api.model.Nutritionist;

import java.time.LocalDateTime;
import java.util.UUID;

public record MeResponse(
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
        Boolean subscriptionActive,
        Boolean readOnly
) {
    public MeResponse(
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
            Integer patientLimit
    ) {
        this(id, name, professionalName, email, role, crn, crnRegional, specialty, whatsapp,
                emailVerified, onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit,
                Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt),
                !Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt));
    }

    public MeResponse(
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
            Integer patientLimit
    ) {
        this(id, name, null, email, role, crn, crnRegional, specialty, whatsapp, false,
                onboardingCompleted, trialEndsAt, subscriptionTier, patientLimit,
                Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt),
                !Nutritionist.isSubscriptionActive(subscriptionTier, trialEndsAt));
    }
}