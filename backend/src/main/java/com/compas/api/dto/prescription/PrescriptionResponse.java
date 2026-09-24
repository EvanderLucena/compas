package com.compas.api.dto.prescription;

import com.compas.api.model.PrescriptionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PrescriptionResponse(
        UUID id,
        UUID patientId,
        String patientName,
        String title,
        String notes,
        PrescriptionStatus status,
        String statusLabel,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PrescriptionItemResponse> items,
        int totalItems,
        String formattedSummary,
        String whatsappMessage
) {
}
