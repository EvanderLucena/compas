package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.service.PatientDocumentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST Controller for generating and downloading official clinical PDFs for a patient:
 * - Plano Alimentar Oficial (Meal Plan)
 * - Lista de Compras da Semana (Weekly Grocery List)
 * - Relatório de Evolução Biométrica (Biometry Report)
 */
@RestController
@RequestMapping("/api/v1/patients/{patientId}/documents")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class PatientDocumentController {

    private final PatientDocumentService patientDocumentService;

    public PatientDocumentController(PatientDocumentService patientDocumentService) {
        this.patientDocumentService = patientDocumentService;
    }

    /**
     * Download the official Meal Plan as PDF.
     */
    @GetMapping("/meal-plan/pdf")
    public ResponseEntity<byte[]> getMealPlanPdf(@PathVariable UUID patientId) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        byte[] pdfBytes = patientDocumentService.generateMealPlanPdf(nutritionistId, patientId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"plano-alimentar-" + patientId + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdfBytes);
    }

    /**
     * Download the Weekly Grocery List as PDF.
     */
    @GetMapping("/grocery-list/pdf")
    public ResponseEntity<byte[]> getGroceryListPdf(@PathVariable UUID patientId) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        byte[] pdfBytes = patientDocumentService.generateGroceryListPdf(nutritionistId, patientId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"lista-compras-" + patientId + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdfBytes);
    }

    /**
     * Download the Biometric Evolution Report as PDF.
     */
    @GetMapping("/biometry/pdf")
    public ResponseEntity<byte[]> getBiometryReportPdf(@PathVariable UUID patientId) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        byte[] pdfBytes = patientDocumentService.generateBiometryReportPdf(nutritionistId, patientId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"relatorio-biometrico-" + patientId + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdfBytes);
    }
}
