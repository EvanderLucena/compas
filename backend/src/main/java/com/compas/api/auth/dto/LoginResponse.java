package com.compas.api.auth.dto;

import java.util.UUID;

public record LoginResponse(
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
    ) {
        public UserDto(
                UUID id,
                String name,
                String email,
                String role,
                Boolean onboardingCompleted,
                Boolean emailVerified
        ) {
            this(id, name, email, role, onboardingCompleted, emailVerified, true, false);
        }

        public UserDto(UUID id, String name, String email, String role, Boolean onboardingCompleted) {
            this(id, name, email, role, onboardingCompleted, false, true, false);
        }
    }
}