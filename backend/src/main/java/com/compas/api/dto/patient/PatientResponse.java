package com.compas.api.dto.patient;

import com.compas.api.model.Patient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String name,
        String initials,
        Integer age,
        LocalDate birthDate,
        String sex,
        Integer heightCm,
        String whatsapp,
        String objective,
        String status,
        Integer adherence,
        BigDecimal weight,
        BigDecimal weightDelta,
        String tag,
        Boolean active,
        String aiAdherenceInsight
) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getName(),
                p.getInitials(),
                p.getAge(),
                p.getBirthDate(),
                p.getSex(),
                p.getHeightCm(),
                p.getWhatsapp(),
                p.getObjective().name(),
                p.getStatus().name(),
                p.getAdherence(),
                p.getWeight(),
                p.getWeightDelta(),
                p.getTag(),
                p.getActive(),
                p.getAiAdherenceInsight()
        );
    }
}