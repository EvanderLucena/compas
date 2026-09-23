package com.compas.api.dto.whatsapp.fleet;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MigratePatientsRequest(
        @NotNull(message = "ID da instância de destino é obrigatório")
        UUID targetInstanceId,
        UUID nutritionistId
) {
}
