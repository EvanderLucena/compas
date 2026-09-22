package com.compas.api.dto.whatsapp;

import java.util.UUID;

/**
 * Internal DTO for extracted/normalized message data passed to the queue.
 */
public record WebhookMessageDTO(
    UUID messageId,
    String senderPhone,
    UUID patientId,
    UUID nutritionistId,
    String messageContent,
    String messageType
) {}
