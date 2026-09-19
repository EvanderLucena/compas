package com.nutriai.api.dto.biometry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BiometryEvolutionSummaryResponse(
        int assessmentCount,
        LocalDate initialAssessmentDate,
        LocalDate latestAssessmentDate,
        BigDecimal initialWeight,
        BigDecimal currentWeight,
        BigDecimal weightDelta,
        BigDecimal initialBodyFatPercent,
        BigDecimal currentBodyFatPercent,
        BigDecimal bodyFatDelta,
        BigDecimal initialLeanMassKg,
        BigDecimal currentLeanMassKg,
        BigDecimal leanMassDelta,
        BigDecimal initialFatMassKg,
        BigDecimal currentFatMassKg,
        BigDecimal fatMassDelta,
        List<PerimetryDeltaResponse> perimetryDeltas,
        String clinicalSynthesis,
        String whatsappFeedbackMessage
) {}
