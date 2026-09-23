package com.compas.api.auth.dto;

import java.util.UUID;

public record RefreshResponse(
        String accessToken,
        UserDto user
) {
    public record UserDto(
            UUID id,
            String name,
            String email,
            String role,
            Boolean onboardingCompleted,
            Boolean emailVerified,
            Boolean subscriptionActive,
            Boolean readOnly
    ) {}
}