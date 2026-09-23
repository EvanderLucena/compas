package com.compas.api.dto.whatsapp.fleet;

import com.compas.api.model.WhatsAppInstanceStatus;

import java.util.UUID;

public record InstanceQrCodeResponse(
        UUID instanceId,
        String instanceName,
        String qrCodeBase64,
        WhatsAppInstanceStatus status,
        String message
) {
}
