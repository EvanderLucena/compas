package com.nutriai.api.dto.jev;

public record JevMealSanityDecision(
        boolean isPlausible,
        double confidence,
        String riskFlag,
        String observation,
        boolean success
) {
    public static JevMealSanityDecision plausibleDefault() {
        return new JevMealSanityDecision(true, 1.0, "NORMAL", "Plausível", true);
    }

    public static JevMealSanityDecision fallback() {
        return new JevMealSanityDecision(true, 0.0, "UNKNOWN", "Fallback", false);
    }
}
