package com.nutriai.api.dto.jev;

import com.nutriai.api.model.PatientStatus;

public record JevAdherenceDecision(
        PatientStatus suggestedStatus,
        double riskScore,
        double confidence,
        String clinicalInsight,
        boolean success
) {
    public static JevAdherenceDecision fallback() {
        return new JevAdherenceDecision(PatientStatus.ONTRACK, 0.0, 0.0, "Análise indisponível", false);
    }
}
