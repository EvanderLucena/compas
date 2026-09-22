package com.compas.api.dto.biometry;

import java.math.BigDecimal;

public record PerimetryDeltaResponse(
        String measureKey,
        String label,
        BigDecimal initialCm,
        BigDecimal currentCm,
        BigDecimal deltaCm
) {}
