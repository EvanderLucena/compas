package com.compas.api.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MeResponse(
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
) {}