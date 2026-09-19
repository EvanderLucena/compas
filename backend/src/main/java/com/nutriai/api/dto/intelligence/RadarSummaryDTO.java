package com.nutriai.api.dto.intelligence;

public record RadarSummaryDTO(
        long totalPatients,
        long requiringAttentionCount,
        long strugglingCount,
        long todayExtractionsCount,
        boolean whatsappConnected
) {}
