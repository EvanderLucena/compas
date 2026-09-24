package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.prescription.CreatePrescriptionRequest;
import com.compas.api.dto.prescription.PrescriptionCatalogItemResponse;
import com.compas.api.dto.prescription.PrescriptionResponse;
import com.compas.api.dto.prescription.UpdatePrescriptionRequest;
import com.compas.api.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/prescriptions")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> list(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        List<PrescriptionResponse> responses = prescriptionService.listPrescriptions(nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getActive(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PrescriptionResponse response = prescriptionService.getActivePrescription(nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<PrescriptionCatalogItemResponse>>> getCatalog(
            @PathVariable UUID patientId
    ) {
        List<PrescriptionCatalogItemResponse> catalog = prescriptionService.getSupplementLibrary();
        return ResponseEntity.ok(ApiResponse.ok(catalog));
    }

    @GetMapping("/{prescriptionId}")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getById(
            @PathVariable UUID patientId,
            @PathVariable UUID prescriptionId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PrescriptionResponse response = prescriptionService.getPrescription(nutritionistId, patientId, prescriptionId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PrescriptionResponse>> create(
            @PathVariable UUID patientId,
            @RequestBody @Valid CreatePrescriptionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PrescriptionResponse response = prescriptionService.createPrescription(nutritionistId, patientId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/patients/" + patientId + "/prescriptions/" + response.id()))
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{prescriptionId}")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> update(
            @PathVariable UUID patientId,
            @PathVariable UUID prescriptionId,
            @RequestBody @Valid UpdatePrescriptionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PrescriptionResponse response = prescriptionService.updatePrescription(
                nutritionistId, patientId, prescriptionId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{prescriptionId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID patientId,
            @PathVariable UUID prescriptionId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        prescriptionService.deletePrescription(nutritionistId, patientId, prescriptionId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{prescriptionId}/pdf")
    public ResponseEntity<byte[]> getPdf(
            @PathVariable UUID patientId,
            @PathVariable UUID prescriptionId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        byte[] pdfBytes = prescriptionService.generatePrescriptionPdf(nutritionistId, patientId, prescriptionId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"receituario-suplementacao-" + prescriptionId + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdfBytes);
    }
}
