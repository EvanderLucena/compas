package com.nutriai.api.dto.jev;

public record JevDecision(
        String intent,
        double intentConfidence,
        String sentiment,
        double sentimentConfidence,
        double attentionScore,
        boolean requiresHumanAttention,
        boolean success,
        String model
) {
    public static JevDecision fallback() {
        return new JevDecision("unknown", 0.0, "neutral", 0.0, 0.0, false, false, "fallback");
    }
}
