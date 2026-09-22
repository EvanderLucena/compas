package com.compas.api.dto.whatsapp;

import java.time.LocalDateTime;

/**
 * DTO for WhatsApp status response.
 */
public record WhatsAppStatusDTO(
    boolean connected,
    int extractionsToday,
    int activePatientsCount,
    LocalDateTime lastWebhookAt
) {}
