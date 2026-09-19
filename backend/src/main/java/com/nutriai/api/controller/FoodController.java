package com.nutriai.api.controller;

import com.nutriai.api.auth.NutritionistAccess;
import com.nutriai.api.dto.ApiResponse;
import com.nutriai.api.dto.food.*;
import com.nutriai.api.service.FoodService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/foods")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FoodResponse>> create(@RequestBody @Valid CreateFoodRequest request) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodResponse response = foodService.createFood(nutritionistId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/foods/" + response.id()))
                .body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<FoodService.FoodListResponse>> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodService.FoodListResponse response = foodService.listFoods(nutritionistId, page, size, search, category);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<com.nutriai.api.dto.jev.JevFoodCategorizationDecision>> suggest(
            @RequestParam String name
    ) {
        var decision = foodService.suggestFoodCategorization(name);
        return ResponseEntity.ok(ApiResponse.ok(decision));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodResponse>> get(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodResponse response = foodService.getFood(nutritionistId, id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateFoodRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        FoodResponse response = foodService.updateFood(nutritionistId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        foodService.deleteFood(nutritionistId, id);
        return ResponseEntity.noContent().build();
    }
}