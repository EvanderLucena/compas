package com.nutriai.api.controller;

import com.nutriai.api.auth.NutritionistAccess;
import com.nutriai.api.dto.ApiResponse;
import com.nutriai.api.dto.plan.*;
import com.nutriai.api.service.MealPlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/plan")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class PlanController {

    private final MealPlanService mealPlanService;

    public PlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PlanResponse>> get(@PathVariable UUID patientId) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PlanResponse response = mealPlanService.getPlan(nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<PlanResponse>> update(
            @PathVariable UUID patientId,
            @RequestBody @Valid UpdatePlanRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        PlanResponse response = mealPlanService.updatePlan(nutritionistId, patientId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/meals")
    public ResponseEntity<ApiResponse<MealSlotResponse>> addMealSlot(
            @PathVariable UUID patientId,
            @RequestBody @Valid AddMealSlotRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealSlotResponse response = mealPlanService.addMealSlot(nutritionistId, patientId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/meals/{mealId}")
    public ResponseEntity<ApiResponse<MealSlotResponse>> updateMealSlot(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @RequestBody @Valid UpdateMealSlotRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealSlotResponse response = mealPlanService.updateMealSlot(nutritionistId, mealId, request.label(), request.time());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/meals/{mealId}")
    public ResponseEntity<Void> deleteMealSlot(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        mealPlanService.deleteMealSlot(nutritionistId, mealId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/meals/{mealId}/options")
    public ResponseEntity<ApiResponse<MealOptionResponse>> addOption(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @RequestBody @Valid AddOptionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealOptionResponse response = mealPlanService.addOption(nutritionistId, mealId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/meals/{mealId}/options/{optionId}")
    public ResponseEntity<ApiResponse<MealOptionResponse>> updateOption(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @PathVariable UUID optionId,
            @RequestBody @Valid UpdateOptionRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealOptionResponse response = mealPlanService.updateOption(nutritionistId, optionId, request.name());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/meals/{mealId}/options/{optionId}")
    public ResponseEntity<Void> deleteOption(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @PathVariable UUID optionId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        mealPlanService.deleteOption(nutritionistId, optionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/meals/{mealId}/options/{optionId}/items")
    public ResponseEntity<ApiResponse<MealFoodResponse>> addFoodItem(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @PathVariable UUID optionId,
            @RequestBody @Valid AddFoodItemRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealFoodResponse response = mealPlanService.addFoodItem(nutritionistId, optionId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/meals/{mealId}/options/{optionId}/items/{itemId}")
    public ResponseEntity<ApiResponse<MealFoodResponse>> updateFoodItem(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @PathVariable UUID optionId,
            @PathVariable UUID itemId,
            @RequestBody @Valid UpdateFoodItemRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MealFoodResponse response = mealPlanService.updateFoodItem(nutritionistId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/meals/{mealId}/options/{optionId}/items/{itemId}")
    public ResponseEntity<Void> deleteFoodItem(
            @PathVariable UUID patientId,
            @PathVariable UUID mealId,
            @PathVariable UUID optionId,
            @PathVariable UUID itemId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        mealPlanService.deleteFoodItem(nutritionistId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/extras")
    public ResponseEntity<ApiResponse<ExtraResponse>> addExtra(
            @PathVariable UUID patientId,
            @RequestBody @Valid AddExtraRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        ExtraResponse response = mealPlanService.addExtra(nutritionistId, patientId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/extras/{extraId}")
    public ResponseEntity<ApiResponse<ExtraResponse>> updateExtra(
            @PathVariable UUID patientId,
            @PathVariable UUID extraId,
            @RequestBody @Valid UpdateExtraRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        ExtraResponse response = mealPlanService.updateExtra(nutritionistId, extraId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/extras/{extraId}")
    public ResponseEntity<Void> deleteExtra(
            @PathVariable UUID patientId,
            @PathVariable UUID extraId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        mealPlanService.deleteExtra(nutritionistId, extraId);
        return ResponseEntity.noContent().build();
    }
}