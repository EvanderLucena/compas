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
 * Off-plan food authorization (D-11/D-12).
 * Extras are free-form items the nutritionist allows outside the structured plan.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "plan_extra")
public class PlanExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String quantity;

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