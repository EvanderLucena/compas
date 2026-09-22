package com.compas.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Meal data extracted from a WhatsApp message by the AI.
 * Links to the patient's active episode for timeline display.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "meal_extraction")
public class MealExtraction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @NotNull
    @Column(name = "episode_id", nullable = false)
    private UUID episodeId;

    @NotNull
    @Column(name = "extraction_raw", nullable = false, columnDefinition = "TEXT")
    private String extractionRaw;

    @Column(name = "meal_label", length = 100)
    private String mealLabel;

    @Column(name = "total_kcal", precision = 6, scale = 1)
    private BigDecimal totalKcal;

    @Column(name = "total_prot", precision = 5, scale = 1)
    private BigDecimal totalProt;

    @Column(name = "total_carb", precision = 5, scale = 1)
    private BigDecimal totalCarb;

    @Column(name = "total_fat", precision = 5, scale = 1)
    private BigDecimal totalFat;

    @Column(name = "sanity_status", length = 30)
    @Builder.Default
    private String sanityStatus = "VERIFIED";

    @Column(name = "sanity_note", length = 255)
    private String sanityNote;

    @NotNull
    @Builder.Default
    @Column(name = "extracted_at", nullable = false)
    private LocalDateTime extractedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (extractedAt == null) {
            extractedAt = LocalDateTime.now();
        }
    }
}