package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "nutritionist")
public class Nutritionist {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.NUTRITIONIST;

    @Column(name = "crn")
    private String crn;

    @Column(name = "crn_regional")
    private String crnRegional;

    @Column
    private String specialty;

    @Column
    private String whatsapp;

    @Column(name = "professional_name")
    private String professionalName;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    @Column(name = "email_verification_expires_at")
    private LocalDateTime emailVerificationExpiresAt;

    public String getDisplayName() {
        if (professionalName != null && !professionalName.isBlank()) {
            return professionalName.trim();
        }
        return name;
    }

    @Column(name = "onboarding_completed")
    @Builder.Default
    private Boolean onboardingCompleted = false;

    @Column(name = "trial_ends_at")
    @Builder.Default
    private LocalDateTime trialEndsAt = null;

    @Column(name = "subscription_tier")
    @Builder.Default
    private String subscriptionTier = "TRIAL";

    @Column(name = "patient_limit")
    @Builder.Default
    private Integer patientLimit = 15;

    public boolean isSubscriptionActive() {
        if (subscriptionTier == null) {
            return false;
        }
        String tier = subscriptionTier.trim().toUpperCase(java.util.Locale.ROOT);
        if ("UNLIMITED".equals(tier) || "PRO".equals(tier) || "STARTER".equals(tier)) {
            return true;
        }
        if ("TRIAL".equals(tier)) {
            if (trialEndsAt == null) {
                return true;
            }
            return trialEndsAt.isAfter(LocalDateTime.now(ZoneOffset.UTC));
        }
        return false;
    }

    public boolean isReadOnly() {
        return !isSubscriptionActive();
    }

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
        if (trialEndsAt == null) {
            trialEndsAt = now.plusDays(30);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}