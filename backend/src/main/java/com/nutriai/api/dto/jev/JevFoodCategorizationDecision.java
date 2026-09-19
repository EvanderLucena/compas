package com.nutriai.api.dto.jev;

public record JevFoodCategorizationDecision(
        String category,
        String unit,
        Double referenceAmount,
        double confidence,
        boolean success
) {
    public static JevFoodCategorizationDecision fallback() {
        return new JevFoodCategorizationDecision("OUTRO", "GRAMAS", 100.0, 0.0, false);
    }
}
