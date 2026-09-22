package com.compas.api.dto.patient;

import com.compas.api.model.Patient;
import org.springframework.data.domain.Page;

import java.util.List;

public record PatientListResponse(
        List<PatientResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static PatientListResponse from(Page<Patient> pageResult) {
        return new PatientListResponse(
                pageResult.getContent().stream().map(PatientResponse::from).toList(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
}