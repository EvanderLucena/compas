package com.compas.api.dto.jev;

public record JevSubstitutionDecision(
        String verdict,
        double confidence,
        boolean sameGroup,
        String rationale,
        boolean success
) {
    public static JevSubstitutionDecision fallback() {
        return new JevSubstitutionDecision("ALLOWED", 0.0, true, "Avaliação não disponível", false);
    }
}
