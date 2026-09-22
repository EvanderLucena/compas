package com.compas.api.model;

/**
 * Patient status enum (D-02).
 * Status is manual — set by the nutritionist, never auto-computed.
 */
public enum PatientStatus {
    ONTRACK,
    WARNING,
    DANGER;

    public String getPortugueseLabel() {
        return switch (this) {
            case ONTRACK -> "On-track";
            case WARNING -> "Atenção";
            case DANGER -> "Crítico";
        };
    }

    public String getColor() {
        return switch (this) {
            case ONTRACK -> "var(--sage)";
            case WARNING -> "var(--amber)";
            case DANGER -> "var(--coral)";
        };
    }
}