package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Food item within a meal option.
 * FK to food_catalog is nullable (D-10: plan survives catalog deletion, ON DELETE SET NULL).
 * Frozen macro values are stored at addition time (D-05: editing catalog does NOT update plans).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meal_food")
public class MealFood {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "option_id", nullable = false)
    private UUID optionId;

    @Column(name = "food_id")
    private UUID foodId; // nullable — free-text foods or after catalog deletion

    @Column(name = "food_name", nullable = false, length = 200)
    private String foodName;

    @Column(name = "reference_amount", precision = 10, scale = 1)
    private BigDecimal referenceAmount;

    @Column(length = 20)
    private String unit;

    @Column(length = 200)
    private String prep; // e.g., "cozido", "cru"

    // Frozen macro values (D-05: decoupled from catalog)
    @Column(precision = 10, scale = 1)
    private BigDecimal kcal;

    @Column(precision = 10, scale = 1)
    private BigDecimal prot;

    @Column(precision = 10, scale = 1)
    private BigDecimal carb;

    @Column(precision = 10, scale = 1)
    private BigDecimal fat;

    @Column(name = "sort_order")
    private Integer sortOrder;
}