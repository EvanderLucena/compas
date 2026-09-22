package com.compas.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Individual food item within a meal extraction.
 * Created by the AI from parsing a patient's meal description.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "extraction_item")
public class ExtractionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "extraction_id", nullable = false)
    private UUID extractionId;

    @NotNull
    @Column(nullable = false, length = 200)
    private String name;

    @NotNull
    @Builder.Default
    @Column(nullable = false, precision = 6, scale = 1)
    private BigDecimal kcal = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 1)
    private BigDecimal prot = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 1)
    private BigDecimal carb = BigDecimal.ZERO;

    @NotNull
    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 1)
    private BigDecimal fat = BigDecimal.ZERO;

    @Column(precision = 6, scale = 1)
    private BigDecimal grams;

    @NotNull
    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @PrePersist
    protected void onCreate() {
        if (kcal == null) kcal = BigDecimal.ZERO;
        if (prot == null) prot = BigDecimal.ZERO;
        if (carb == null) carb = BigDecimal.ZERO;
        if (fat == null) fat = BigDecimal.ZERO;
        if (sortOrder == null) sortOrder = 0;
    }
}