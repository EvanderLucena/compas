package com.compas.api.model;

/**
 * Category of a prescribed item.
 */
public enum PrescriptionCategory {
    SUPPLEMENT,
    VITAMIN_MINERAL,
    PHYTOTHERAPY,
    MANIPULATED,
    HABIT,
    OTHER;

    public String getPortugueseLabel() {
        return switch (this) {
            case SUPPLEMENT -> "Suplemento";
            case VITAMIN_MINERAL -> "Vitamina / Mineral";
            case PHYTOTHERAPY -> "Fitoterápico";
            case MANIPULATED -> "Manipulado";
            case HABIT -> "Hábito / Hidratação";
            case OTHER -> "Outro";
        };
    }
}
