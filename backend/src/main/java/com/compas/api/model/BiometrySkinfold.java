package com.compas.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Skinfold measurement linked to a biometry assessment.
 * Uses measure_key + sort_order for flexible, ordered entries.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "biometry_skinfold")
public class BiometrySkinfold {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private BiometryAssessment assessment;

    @NotNull
    @Column(name = "measure_key", nullable = false, length = 50)
    private String measureKey;

    @NotNull
    @Column(name = "value_mm", nullable = false, precision = 5, scale = 2)
    private BigDecimal valueMm;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

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
