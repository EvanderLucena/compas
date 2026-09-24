package com.compas.api.dto.prescription;

import com.compas.api.model.PrescriptionCategory;

public record PrescriptionCatalogItemResponse(
        String id,
        String name,
        PrescriptionCategory category,
        String categoryLabel,
        String defaultDosage,
        String defaultForm,
        String defaultTiming,
        String defaultDuration,
        boolean isContinuous,
        String instructions,
        String clinicalPurpose
) {
}
