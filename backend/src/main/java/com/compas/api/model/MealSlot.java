package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Meal slot within a meal plan (e.g., "Café da manhã", "Almoço").
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meal_slot")
public class MealSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(length = 5)
    private String time;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // Relationships managed via raw UUID FKs — cascade at DB level and service layer
}