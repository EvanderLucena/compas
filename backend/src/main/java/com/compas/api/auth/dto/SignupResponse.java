package com.compas.api.auth.dto;

import java.util.UUID;

public record SignupResponse(
        String accessToken,
        UserDto user
) {
    public record UserDto(
            UUID id,
            String name,
            String email,
            String role,
            Boolean onboardingCompleted,
            Boolean emailVerified
    ) {
        public UserDto(UUID id, String name, String email, String role, Boolean onboardingCompleted) {
            this(id, name, email, role, onboardingCompleted, false);
        }
    }
}