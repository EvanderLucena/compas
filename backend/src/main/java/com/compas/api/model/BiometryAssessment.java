package com.compas.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Biometric assessment tied to an active episode (D-09).
 * Scoped by nutritionist for tenant isolation (D-10).
 * Required: date, weight, body fat %. All other fields nullable.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "biometry_assessment")
public class BiometryAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @NotNull
    @Column(name = "episode_id", nullable = false)
    private UUID episodeId;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;

    @NotNull
    @Column(name = "weight", precision = 6, scale = 2, nullable = false)
    private BigDecimal weight;

    @NotNull
    @Column(name = "body_fat_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal bodyFatPercent;

    @Column(name = "lean_mass_kg", precision = 6, scale = 2)
    private BigDecimal leanMassKg;

    @Column(name = "water_percent", precision = 5, scale = 2)
    private BigDecimal waterPercent;

    @Column(name = "visceral_fat_level")
    private Integer visceralFatLevel;

    @Column(name = "bmr_kcal")
    private Integer bmrKcal;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "assessment")
    @Builder.Default
    private List<BiometrySkinfold> skinfolds = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "assessment")
    @Builder.Default
    private List<BiometryPerimetry> perimetries = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
