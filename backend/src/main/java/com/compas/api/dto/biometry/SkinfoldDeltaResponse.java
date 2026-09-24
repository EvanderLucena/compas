package com.compas.api.dto.biometry;

import java.math.BigDecimal;

public record SkinfoldDeltaResponse(
        String measureKey,
        String label,
        BigDecimal initialMm,
        BigDecimal currentMm,
        BigDecimal deltaMm,
        BigDecimal deltaPercent
) {}
