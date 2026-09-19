package com.nutriai.api.controller;

import com.nutriai.api.auth.NutritionistAccess;
import com.nutriai.api.dto.ApiResponse;
import com.nutriai.api.dto.biometry.BiometryAssessmentResponse;
import com.nutriai.api.dto.biometry.BiometryEvolutionSummaryResponse;
import com.nutriai.api.dto.biometry.BiometryHistoryEpisodeResponse;
import com.nutriai.api.dto.biometry.BiometryHistorySnapshotResponse;
import com.nutriai.api.dto.biometry.CreateBiometryAssessmentRequest;
import com.nutriai.api.dto.biometry.UpdateBiometryAssessmentRequest;
import com.nutriai.api.service.BiometryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/biometry")
@PreAuthorize("hasRole('NUTRITIONIST')")
public class BiometryController {

    private final BiometryService biometryService;

    public BiometryController(BiometryService biometryService) {
        this.biometryService = biometryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BiometryAssessmentResponse>> create(
            @PathVariable UUID patientId,
            @RequestBody @Valid CreateBiometryAssessmentRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        BiometryAssessmentResponse response = biometryService.createAssessment(nutritionistId, patientId, request);
        return ResponseEntity
                .created(URI.create("/api/v1/patients/" + patientId + "/biometry/" + response.id()))
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{assessmentId}")
    public ResponseEntity<ApiResponse<BiometryAssessmentResponse>> update(
            @PathVariable UUID patientId,
            @PathVariable UUID assessmentId,
            @RequestBody @Valid UpdateBiometryAssessmentRequest request
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        BiometryAssessmentResponse response = biometryService.updateAssessment(nutritionistId, patientId, assessmentId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BiometryAssessmentResponse>>> list(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        List<BiometryAssessmentResponse> response = biometryService.listAssessments(nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history/episodes")
    public ResponseEntity<ApiResponse<List<BiometryHistoryEpisodeResponse>>> listHistoryEpisodes(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        List<BiometryHistoryEpisodeResponse> response = biometryService.listHistoryEpisodes(nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history/episodes/{episodeId}")
    public ResponseEntity<ApiResponse<BiometryHistorySnapshotResponse>> getHistorySnapshot(
            @PathVariable UUID patientId,
            @PathVariable UUID episodeId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        BiometryHistorySnapshotResponse response = biometryService.getHistorySnapshot(nutritionistId, patientId, episodeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/evolution-summary")
    public ResponseEntity<ApiResponse<BiometryEvolutionSummaryResponse>> getEvolutionSummary(
            @PathVariable UUID patientId
    ) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        BiometryEvolutionSummaryResponse response = biometryService.getBiometryEvolutionSummary(
                nutritionistId, patientId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}