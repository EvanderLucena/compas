package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patient")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    /**
     * FK to nutritionist — raw UUID, not @ManyToOne (D-10).
     * Simpler querying, avoids lazy-loading Nutritionist entity.
     */
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @Column(nullable = false)
    private String name;

    @Column(length = 5)
    private String initials;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 1)
    private String sex;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(length = 30)
    private String whatsapp;

    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PatientObjective objective = PatientObjective.SAUDE_GERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PatientStatus status = PatientStatus.ONTRACK;

    @Builder.Default
    private Integer adherence = 80;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "weight_delta", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal weightDelta = BigDecimal.ZERO;

    @Column(length = 50)
    private String tag;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "ai_adherence_insight", length = 500)
    private String aiAdherenceInsight;

    @Column(name = "ai_adherence_updated_at")
    private LocalDateTime aiAdherenceUpdatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (initials == null && name != null) {
            initials = computeInitials(name);
        }
        if (active == null) {
            active = true;
        }
        if (status == null) {
            status = PatientStatus.ONTRACK;
        }
        if (objective == null) {
            objective = PatientObjective.SAUDE_GERAL;
        }
        if (adherence == null) {
            adherence = 80;
        }
        if (weightDelta == null) {
            weightDelta = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Soft delete — sets active=false (D-05).
     */
    public void softDelete() {
        this.active = false;
    }

    /**
     * Reactivate — sets active=true.
     */
    public void reactivate() {
        this.active = true;
    }

    /**
     * Compute initials from name: first letter of each word, up to 2 chars.
     */
    private String computeInitials(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(words.length, 2); i++) {
            if (!words[i].isEmpty()) {
                sb.append(Character.toUpperCase(words[i].charAt(0)));
            }
        }
        return sb.toString();
    }
}