package com.compas.api.dto.whatsapp.fleet;

import com.compas.api.model.WhatsAppInstanceStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record WhatsAppFleetInstanceDTO(
        UUID id,
        String name,
        String phoneNumber,
        String description,
        WhatsAppInstanceStatus status,
        String qrCodeBase64,
        Integer maxPatients,
        Boolean active,
        long patientCount,
        long nutritionistCount,
        int capacityPercentage,
        boolean isNearCapacity,
        LocalDateTime lastHeartbeatAt,
        LocalDateTime disconnectedAt,
        LocalDateTime createdAt
) {
}
