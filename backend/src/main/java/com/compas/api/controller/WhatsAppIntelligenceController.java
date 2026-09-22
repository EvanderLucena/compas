package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.whatsapp.*;
import com.compas.api.service.WhatsAppIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for WhatsApp Intelligence endpoints per D-23.
 * All endpoints scoped by nutritionistId from JWT for tenant isolation.
 */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class WhatsAppIntelligenceController {

    private final WhatsAppIntelligenceService whatsAppIntelligenceService;

    public WhatsAppIntelligenceController(WhatsAppIntelligenceService whatsAppIntelligenceService) {
        this.whatsAppIntelligenceService = whatsAppIntelligenceService;
    }

    /**
     * GET /api/v1/patients/{id}/extractions — list extractions for date (defaults to today).
     */
    @GetMapping("/patients/{patientId}/extractions")
    public ResponseEntity<ApiResponse<List<ExtractionDTO>>> getExtractions(
            @PathVariable UUID patientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        List<ExtractionDTO> extractions = whatsAppIntelligenceService.getExtractions(patientId, nutritionistId, date);
        return ResponseEntity.ok(ApiResponse.ok(extractions));
    }

    /**
     * PATCH /api/v1/patients/{id}/extractions/{extractionId} — correct extraction (D-12, D-21, D-23).
     */
    @PatchMapping("/patients/{patientId}/extractions/{extractionId}")
    public ResponseEntity<ApiResponse<ExtractionDTO>> correctExtraction(
            @PathVariable UUID patientId,
            @PathVariable UUID extractionId,
            @Valid @RequestBody PatchExtractionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        ExtractionDTO updated = whatsAppIntelligenceService.correctExtraction(
                patientId, nutritionistId, extractionId, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * GET /api/v1/patients/{id}/activation-link — generate WhatsApp link (D-15, D-23).
     */
    @GetMapping("/patients/{patientId}/activation-link")
    public ResponseEntity<ApiResponse<ActivationLinkDTO>> getActivationLink(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        ActivationLinkDTO link = whatsAppIntelligenceService.getActivationLink(patientId, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(link));
    }

    /**
     * GET /api/v1/whatsapp/status — WhatsApp instance health (D-23).
     */
    @GetMapping("/whatsapp/status")
    public ResponseEntity<ApiResponse<WhatsAppStatusDTO>> getWhatsAppStatus() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        WhatsAppStatusDTO status = whatsAppIntelligenceService.getWhatsAppStatus(nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}