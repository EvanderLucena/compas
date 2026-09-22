package com.compas.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Meal option within a slot (D-04: multiple options per meal).
 * e.g., "Opção 1 · Clássico", "Opção 2 · Vegetariano"
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meal_option")
public class MealOption {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "meal_slot_id", nullable = false)
    private UUID mealSlotId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // Relationships managed via raw UUID FKs — cascade at DB level and service layer
}