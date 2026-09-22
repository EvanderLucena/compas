package com.compas.api.dto.biometry;

import com.compas.api.model.BiometryAssessment;
import com.compas.api.model.BiometryPerimetry;
import com.compas.api.model.BiometrySkinfold;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BiometryAssessmentResponse(
        UUID id,
        UUID episodeId,
        LocalDate assessmentDate,
        BigDecimal weight,
        BigDecimal bodyFatPercent,
        BigDecimal leanMassKg,
        BigDecimal waterPercent,
        Integer visceralFatLevel,
        Integer bmrKcal,
        String notes,
        List<SkinfoldResponse> skinfolds,
        List<PerimetryResponse> perimetry
) {
    public record SkinfoldResponse(
            UUID id,
            String measureKey,
            BigDecimal valueMm,
            Integer sortOrder
    ) {}

    public record PerimetryResponse(
            UUID id,
            String measureKey,
            BigDecimal valueCm,
            Integer sortOrder
    ) {}

    public static BiometryAssessmentResponse from(
            BiometryAssessment a,
            List<BiometrySkinfold> skinfolds,
            List<BiometryPerimetry> perimetries
    ) {
        return new BiometryAssessmentResponse(
                a.getId(),
                a.getEpisodeId(),
                a.getAssessmentDate(),
                a.getWeight(),
                a.getBodyFatPercent(),
                a.getLeanMassKg(),
                a.getWaterPercent(),
                a.getVisceralFatLevel(),
                a.getBmrKcal(),
                a.getNotes(),
                mapSkinfolds(skinfolds),
                mapPerimetries(perimetries)
        );
    }

    private static List<SkinfoldResponse> mapSkinfolds(List<BiometrySkinfold> skinfolds) {
        return skinfolds == null ? List.of() : skinfolds.stream()
                .map(s -> new SkinfoldResponse(s.getId(), s.getMeasureKey(), s.getValueMm(), s.getSortOrder()))
                .toList();
    }

    private static List<PerimetryResponse> mapPerimetries(List<BiometryPerimetry> perimetries) {
        return perimetries == null ? List.of() : perimetries.stream()
                .map(p -> new PerimetryResponse(p.getId(), p.getMeasureKey(), p.getValueCm(), p.getSortOrder()))
                .toList();
    }
}
