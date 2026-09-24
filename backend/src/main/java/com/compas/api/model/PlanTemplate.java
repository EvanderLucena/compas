package com.compas.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reusable meal plan template entity (D-14).
 * Can be a system default (nutritionistId is null, isSystem = true)
 * or a custom template created by a nutritionist.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "plan_template")
public class PlanTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "nutritionist_id")
    private UUID nutritionistId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String category = "GERAL";

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "kcal_target", precision = 10, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal kcalTarget = new BigDecimal("1800.0");

    @Column(name = "prot_target", precision = 10, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal protTarget = new BigDecimal("90.0");

    @Column(name = "carb_target", precision = 10, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal carbTarget = new BigDecimal("200.0");

    @Column(name = "fat_target", precision = 10, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal fatTarget = new BigDecimal("60.0");

    @Column(name = "structure_json", columnDefinition = "TEXT", nullable = false)
    private String structureJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
