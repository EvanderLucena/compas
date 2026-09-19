package com.nutriai.api.controller;

import com.nutriai.api.auth.NutritionistAccess;
import com.nutriai.api.dto.ApiResponse;
import com.nutriai.api.dto.intelligence.ClinicalRadarDTO;
import com.nutriai.api.service.ClinicalRadarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clinical-radar")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class ClinicalRadarController {

    private final ClinicalRadarService clinicalRadarService;

    public ClinicalRadarController(ClinicalRadarService clinicalRadarService) {
        this.clinicalRadarService = clinicalRadarService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ClinicalRadarDTO>> getClinicalRadar() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        ClinicalRadarDTO data = clinicalRadarService.getClinicalRadar(nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/attention/{messageId}/resolve")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> resolveAttention(
            @PathVariable UUID messageId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        clinicalRadarService.resolveAttentionItem(messageId, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("resolved", true)));
    }
}
