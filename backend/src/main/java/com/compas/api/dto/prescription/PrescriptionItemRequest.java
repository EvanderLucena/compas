package com.compas.api.dto.prescription;

import com.compas.api.model.PrescriptionCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PrescriptionItemRequest(
        @NotBlank(message = "Nome do item é obrigatório")
        @Size(max = 120, message = "Nome do item deve ter no máximo 120 caracteres")
        String name,

        PrescriptionCategory category,

        @NotBlank(message = "Posologia/dose é obrigatória")
        @Size(max = 80, message = "Posologia deve ter no máximo 80 caracteres")
        String dosage,

        @Size(max = 50, message = "Forma farmacêutica deve ter no máximo 50 caracteres")
        String form,

        @NotBlank(message = "Horário/instrução de tomada é obrigatório")
        @Size(max = 150, message = "Horário deve ter no máximo 150 caracteres")
        String timing,

        @Size(max = 60, message = "Duração deve ter no máximo 60 caracteres")
        String duration,

        Boolean isContinuous,

        String instructions,

        Integer displayOrder
) {
}
