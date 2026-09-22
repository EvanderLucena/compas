package com.compas.api.dto.biometry;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateBiometryAssessmentRequest(
        @NotNull(message = "Data da avaliação é obrigatória")
        LocalDate assessmentDate,

        @NotNull(message = "Peso é obrigatório")
        @DecimalMin(value = "0.1", message = "O peso deve ser maior que zero")
        @DecimalMax(value = "500.0", message = "O peso deve ser de no máximo 500 kg")
        BigDecimal weight,

        @NotNull(message = "% de gordura é obrigatório")
        @DecimalMin(value = "0.01", message = "% de gordura deve ser maior que zero")
        @DecimalMax(value = "100.0", message = "% de gordura deve ser de no máximo 100%")
        BigDecimal bodyFatPercent,

        @DecimalMin(value = "0.0", message = "Massa magra não pode ser negativa")
        @DecimalMax(value = "500.0", message = "Massa magra deve ser de no máximo 500 kg")
        BigDecimal leanMassKg,

        @DecimalMin(value = "0.0", message = "% de água não pode ser negativo")
        @DecimalMax(value = "100.0", message = "% de água deve ser de no máximo 100%")
        BigDecimal waterPercent,

        @PositiveOrZero(message = "Nível de gordura visceral não pode ser negativo")
        Integer visceralFatLevel,

        @PositiveOrZero(message = "TMB não pode ser negativa")
        Integer bmrKcal,

        String notes,

        @Valid
        List<SkinfoldEntry> skinfolds,

        @Valid
        List<PerimetryEntry> perimetry
) {
    public record SkinfoldEntry(
            @NotBlank(message = "Identificador da dobra é obrigatório")
            String measureKey,

            @NotNull(message = "Valor da dobra é obrigatório")
            @DecimalMin(value = "0.0", message = "Valor da dobra não pode ser negativo")
            @DecimalMax(value = "200.0", message = "Valor da dobra deve ser de no máximo 200 mm")
            BigDecimal valueMm,

            @NotNull(message = "Ordem da dobra é obrigatória")
            @Positive(message = "Ordem da dobra deve ser positiva")
            Integer sortOrder
    ) {}

    public record PerimetryEntry(
            @NotBlank(message = "Identificador da perimetria é obrigatório")
            String measureKey,

            @NotNull(message = "Valor da perimetria é obrigatório")
            @DecimalMin(value = "0.0", message = "Valor da perimetria não pode ser negativo")
            @DecimalMax(value = "300.0", message = "Valor da perimetria deve ser de no máximo 300 cm")
            BigDecimal valueCm,

            @NotNull(message = "Ordem da perimetria é obrigatória")
            @Positive(message = "Ordem da perimetria deve ser positiva")
            Integer sortOrder
    ) {}
}
