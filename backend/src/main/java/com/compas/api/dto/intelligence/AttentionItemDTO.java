package com.compas.api.dto.intelligence;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttentionItemDTO(
        UUID messageId,
        UUID patientId,
        String patientName,
        String patientWhatsapp,
        String messageSnippet,
        String intent,
        BigDecimal intentConfidence,
        String sentiment,
        BigDecimal sentimentConfidence,
        BigDecimal attentionScore,
        LocalDateTime createdAt
) {}
