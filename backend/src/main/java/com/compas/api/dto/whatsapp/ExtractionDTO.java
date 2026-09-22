package com.compas.api.dto.whatsapp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for meal extraction responses.
 */
public record ExtractionDTO(
    UUID id,
    String mealLabel,
    String extractionRaw,
    List<ExtractionItemDTO> items,
    BigDecimal totalKcal,
    BigDecimal totalProt,
    BigDecimal totalCarb,
    BigDecimal totalFat,
    LocalDateTime extractedAt
) {}
