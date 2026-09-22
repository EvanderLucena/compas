package com.compas.api.controller;

import com.compas.api.auth.NutritionistAccess;
import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.nutritionist.ChangePasswordRequest;
import com.compas.api.dto.nutritionist.NutritionistProfileResponse;
import com.compas.api.dto.nutritionist.UpdateProfileRequest;
import com.compas.api.service.NutritionistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nutritionist")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class NutritionistController {

    private final NutritionistService nutritionistService;

    public NutritionistController(NutritionistService nutritionistService) {
        this.nutritionistService = nutritionistService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<NutritionistProfileResponse>> getProfile() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        NutritionistProfileResponse profile = nutritionistService.getProfile(nutritionistId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<NutritionistProfileResponse>> updateProfile(
            @RequestBody @Valid UpdateProfileRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        NutritionistProfileResponse profile = nutritionistService.updateProfile(nutritionistId, request);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            @RequestBody @Valid ChangePasswordRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        nutritionistService.changePassword(nutritionistId, request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Senha alterada com sucesso")));
    }
}
