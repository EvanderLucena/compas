package com.compas.api.dto.prescription;

import com.compas.api.model.PrescriptionStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePrescriptionRequest(
        @NotBlank(message = "Título da prescrição é obrigatório")
        @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
        String title,

        String notes,

        PrescriptionStatus status,

        @NotEmpty(message = "Prescrição deve conter pelo menos um item")
        @Valid
        List<PrescriptionItemRequest> items
) {
}
