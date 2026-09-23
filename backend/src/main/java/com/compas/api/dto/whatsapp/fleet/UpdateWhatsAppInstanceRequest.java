package com.compas.api.dto.whatsapp.fleet;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateWhatsAppInstanceRequest(
        @Size(max = 30, message = "Telefone não pode exceder 30 caracteres")
        String phoneNumber,

        @Size(max = 255, message = "Descrição não pode exceder 255 caracteres")
        String description,

        @Min(value = 10, message = "Capacidade mínima de pacientes é 10")
        @Max(value = 1000, message = "Capacidade máxima de pacientes é 1000")
        Integer maxPatients,

        Boolean active
) {
}
