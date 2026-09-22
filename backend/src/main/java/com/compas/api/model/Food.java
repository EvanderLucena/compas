package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "food_catalog")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "nutritionist_id")
    private UUID nutritionistId;

    public boolean isCustom() {
        return nutritionistId != null;
    }

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(name = "unit", length = 20, nullable = false)
    private String unit;

    @Column(name = "reference_amount", precision = 10, scale = 1, nullable = false)
    private BigDecimal referenceAmount;

    @Column(precision = 10, scale = 1, nullable = false)
    private BigDecimal kcal;

    @Column(precision = 10, scale = 1, nullable = false)
    private BigDecimal prot;

    @Column(precision = 10, scale = 1, nullable = false)
    private BigDecimal carb;

    @Column(precision = 10, scale = 1, nullable = false)
    private BigDecimal fat;

    @Column(precision = 10, scale = 1)
    private BigDecimal fiber;

    @Column(name = "prep", length = 200)
    private String prep;

    @Column(name = "portion_label", length = 200)
    private String portionLabel;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (usedCount == null) {
            usedCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}