package com.nutriai.api.dto.patient;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdatePatientRequest(
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        @Past(message = "A data de nascimento deve ser no passado")
        LocalDate birthDate,

        @Pattern(regexp = "^[FM]$", message = "Sexo deve ser M ou F")
        String sex,

        @Min(value = 50, message = "Altura deve ter no mínimo 50 cm")
        @Max(value = 300, message = "Altura deve ter no máximo 300 cm")
        Integer heightCm,

        @Size(max = 30, message = "WhatsApp deve ter no máximo 30 caracteres")
        String whatsapp,

        String objective,

        String status,

        @DecimalMin(value = "0.1", message = "O peso deve ser maior que zero")
        @DecimalMax(value = "500.0", message = "O peso deve ser de no máximo 500 kg")
        BigDecimal weight,

        BigDecimal weightDelta,

        @Min(value = 0, message = "Adesão deve ser no mínimo 0%")
        @Max(value = 100, message = "Adesão deve ser no máximo 100%")
        Integer adherence,

        @Size(max = 50, message = "Tag deve ter no máximo 50 caracteres")
        String tag
) {}