package com.compas.api.model;

/**
 * Fixed list of patient objectives (D-04).
 * Dropdown selection — not free text — for consistent filtering and reporting.
 */
public enum PatientObjective {
    EMAGRECIMENTO,
    HIPERTROFIA,
    CONTROLE_GLICEMICO,
    PERFORMANCE_ESPORTIVA,
    REEDUCACAO_ALIMENTAR,
    CONTROLE_PRESSAO,
    SAUDE_GERAL;

    public String getPortugueseLabel() {
        return switch (this) {
            case EMAGRECIMENTO -> "Emagrecimento";
            case HIPERTROFIA -> "Hipertrofia";
            case CONTROLE_GLICEMICO -> "Controle glicêmico";
            case PERFORMANCE_ESPORTIVA -> "Performance esportiva";
            case REEDUCACAO_ALIMENTAR -> "Reeducação alimentar";
            case CONTROLE_PRESSAO -> "Controle pressão";
            case SAUDE_GERAL -> "Saúde geral";
        };
    }
}