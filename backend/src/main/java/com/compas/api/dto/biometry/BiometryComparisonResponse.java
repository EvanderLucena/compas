package com.compas.api.dto.biometry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BiometryComparisonResponse(
        UUID baseAssessmentId,
        UUID targetAssessmentId,
        LocalDate baseDate,
        LocalDate targetDate,
        long daysBetween,
        // Overall Composition
        BigDecimal baseWeight,
        BigDecimal targetWeight,
        BigDecimal weightDelta,
        BigDecimal weightDeltaPercent,
        BigDecimal baseBodyFatPercent,
        BigDecimal targetBodyFatPercent,
        BigDecimal bodyFatDelta,
        BigDecimal baseLeanMassKg,
        BigDecimal targetLeanMassKg,
        BigDecimal leanMassDelta,
        BigDecimal baseFatMassKg,
        BigDecimal targetFatMassKg,
        BigDecimal fatMassDelta,
        BigDecimal baseWaterPercent,
        BigDecimal targetWaterPercent,
        BigDecimal waterDelta,
        Integer baseVisceralFat,
        Integer targetVisceralFat,
        Integer visceralFatDelta,
        Integer baseBmrKcal,
        Integer targetBmrKcal,
        Integer bmrDeltaKcal,
        // Skinfolds
        BigDecimal baseSkinfoldsSumMm,
        BigDecimal targetSkinfoldsSumMm,
        BigDecimal skinfoldsSumDeltaMm,
        BigDecimal skinfoldsSumDeltaPercent,
        List<SkinfoldDeltaResponse> skinfoldDeltas,
        // Perimetry
        BigDecimal baseWaistHipRatio,
        BigDecimal targetWaistHipRatio,
        BigDecimal waistHipRatioDelta,
        List<PerimetryDeltaResponse> perimetryDeltas,
        // Clinical synthesis & Classification
        String clinicalClassification,
        String clinicalSynthesis,
        String whatsappFeedbackMessage
) {}
