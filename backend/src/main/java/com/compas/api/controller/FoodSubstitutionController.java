package com.compas.api.controller;

import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.substitution.FoodSubstitutionRequest;
import com.compas.api.dto.substitution.FoodSubstitutionResponse;
import com.compas.api.auth.NutritionistAccess;
import com.compas.api.service.FoodSubstitutionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller for intelligent TACO food substitution and nutritional equivalence.
 */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class FoodSubstitutionController {

    private final FoodSubstitutionService foodSubstitutionService;

    public FoodSubstitutionController(FoodSubstitutionService foodSubstitutionService) {
        this.foodSubstitutionService = foodSubstitutionService;
    }

    /**
     * Calculate food substitutions customized with patient eating habits and recent meal logs.
     */
    @PostMapping("/patients/{patientId}/food-substitutions")
    public ResponseEntity<ApiResponse<FoodSubstitutionResponse>> calculateForPatient(
            @PathVariable UUID patientId,
            @Valid @RequestBody FoodSubstitutionRequest request) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodSubstitutionResponse response = foodSubstitutionService.calculateSubstitutionsForPatient(
                nutritionistId, patientId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * General clinical food substitution calculator (without patient habit bias).
     */
    @PostMapping("/food-substitutions/calculate")
    public ResponseEntity<ApiResponse<FoodSubstitutionResponse>> calculateGeneral(
            @Valid @RequestBody FoodSubstitutionRequest request) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(
                nutritionistId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
