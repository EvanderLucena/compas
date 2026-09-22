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

/**
 * Meal plan entity linked 1:1 to an episode (D-13).
 * Each patient episode has exactly one plan.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meal_plan")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "episode_id", nullable = false, unique = true)
    private UUID episodeId;

    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @Column(nullable = false, length = 200)
    @Builder.Default
    private String title = "Plano alimentar";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "kcal_target", precision = 10, scale = 1)
    @Builder.Default
    private BigDecimal kcalTarget = new BigDecimal("1800");

    @Column(name = "prot_target", precision = 10, scale = 1)
    @Builder.Default
    private BigDecimal protTarget = new BigDecimal("90");

    @Column(name = "carb_target", precision = 10, scale = 1)
    @Builder.Default
    private BigDecimal carbTarget = new BigDecimal("200");

    @Column(name = "fat_target", precision = 10, scale = 1)
    @Builder.Default
    private BigDecimal fatTarget = new BigDecimal("60");

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Relationships managed via raw UUID FKs — cascade at DB level and service layer
    // No JPA @OneToMany mappedBy since children use UUID FK, not @ManyToOne

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