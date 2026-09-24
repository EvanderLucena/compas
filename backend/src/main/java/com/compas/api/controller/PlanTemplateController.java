package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.plan.PlanResponse;
import com.compas.api.dto.plantemplate.CreatePlanTemplateRequest;
import com.compas.api.dto.plantemplate.PlanTemplateResponse;
import com.compas.api.dto.plantemplate.SavePlanAsTemplateRequest;
import com.compas.api.service.PlanTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing meal plan templates (D-14).
 * Allows listing, creating, saving from patient plan, applying to patient plan, and deleting.
 */
@RestController
@RequestMapping("/api/v1/plan-templates")
@PreAuthorize("hasRole('NUTRITIONIST')")
@RequiredArgsConstructor
public class PlanTemplateController {

    private final PlanTemplateService planTemplateService;

    @GetMapping
    public ApiResponse<List<PlanTemplateResponse>> listTemplates() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        return ApiResponse.ok(planTemplateService.listTemplates(nutritionistId));
    }

    @GetMapping("/{id}")
    public ApiResponse<PlanTemplateResponse> getTemplate(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        return ApiResponse.ok(planTemplateService.getTemplate(id, nutritionistId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlanTemplateResponse>> createTemplate(
            @Valid @RequestBody CreatePlanTemplateRequest req
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PlanTemplateResponse created = planTemplateService.createTemplate(nutritionistId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PostMapping("/save-from-patient/{patientId}")
    public ResponseEntity<ApiResponse<PlanTemplateResponse>> savePlanAsTemplate(
            @PathVariable UUID patientId,
            @Valid @RequestBody SavePlanAsTemplateRequest req
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PlanTemplateResponse created = planTemplateService.savePlanAsTemplate(nutritionistId, patientId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PostMapping("/{templateId}/apply-to-patient/{patientId}")
    public ApiResponse<PlanResponse> applyTemplateToPatient(
            @PathVariable UUID templateId,
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PlanResponse updatedPlan = planTemplateService.applyTemplateToPatient(nutritionistId, patientId, templateId);
        return ApiResponse.ok(updatedPlan);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTemplate(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        planTemplateService.deleteTemplate(id, nutritionistId);
        return ApiResponse.ok(null);
    }
}
