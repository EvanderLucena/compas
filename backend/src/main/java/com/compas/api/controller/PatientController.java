package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.patient.*;
import com.compas.api.service.PatientService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PatientResponse>> create(@RequestBody @Valid CreatePatientRequest request) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientResponse response = patientService.createPatient(nutritionistId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/patients/" + response.id()))
                .body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PatientListResponse>> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String objective,
            @RequestParam(required = false) Boolean active
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientListResponse response = patientService.listPatients(nutritionistId, search, status, objective, active, page, size);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientResponse>> get(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientResponse response = patientService.getPatient(id, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePatientRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientResponse response = patientService.updatePatient(id, nutritionistId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<PatientResponse>> deactivate(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientResponse response = patientService.deactivatePatient(id, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<PatientResponse>> reactivate(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PatientResponse response = patientService.reactivatePatient(id, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/evaluate-adherence")
    public ResponseEntity<ApiResponse<com.compas.api.dto.jev.JevAdherenceDecision>> evaluateAdherence(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        var decision = patientService.evaluatePatientAdherence(id, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(decision));
    }

    @PostMapping("/{patientId}/plan/evaluate-substitution")
    public ResponseEntity<ApiResponse<com.compas.api.dto.jev.JevSubstitutionDecision>> evaluateSubstitution(
            @PathVariable UUID patientId,
            @RequestBody @Valid com.compas.api.dto.plan.EvaluateSubstitutionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        var decision = patientService.evaluateSubstitution(
                nutritionistId, patientId, request.prescribedFood(), request.desiredFood());
        return ResponseEntity.ok(ApiResponse.ok(decision));
    }

    @GetMapping("/{id}/consumption-patterns")
    public ResponseEntity<ApiResponse<com.compas.api.dto.intelligence.PatientConsumptionPatternsDTO>> getConsumptionPatterns(
            @PathVariable UUID id
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        var patterns = patientService.getConsumptionPatterns(id, nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(patterns));
    }
}