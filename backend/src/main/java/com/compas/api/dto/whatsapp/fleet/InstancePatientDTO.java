package com.compas.api.dto.whatsapp.fleet;

import java.util.UUID;

public record InstancePatientDTO(
        UUID id,
        String name,
        String whatsapp,
        UUID nutritionistId,
        String status
) {
}
