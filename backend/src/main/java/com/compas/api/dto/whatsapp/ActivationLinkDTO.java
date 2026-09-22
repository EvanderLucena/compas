package com.compas.api.dto.whatsapp;

/**
 * DTO for WhatsApp activation link response.
 */
public record ActivationLinkDTO(
    String link,
    String phone,
    boolean isActivated
) {}
