package com.compas.api.model;

/**
 * Lifecycle status of a nutritional prescription.
 */
public enum PrescriptionStatus {
    ACTIVE,
    COMPLETED,
    ARCHIVED;

    public String getPortugueseLabel() {
        return switch (this) {
            case ACTIVE -> "Ativa";
            case COMPLETED -> "Concluída";
            case ARCHIVED -> "Arquivada";
        };
    }
}
