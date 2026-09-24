package com.compas.api.dto.prescription;

import com.compas.api.model.PrescriptionCategory;

import java.util.UUID;

public record PrescriptionItemResponse(
        UUID id,
        UUID prescriptionId,
        String name,
        PrescriptionCategory category,
        String categoryLabel,
        String dosage,
        String form,
        String timing,
        String duration,
        boolean isContinuous,
        String instructions,
        int displayOrder
) {
}
