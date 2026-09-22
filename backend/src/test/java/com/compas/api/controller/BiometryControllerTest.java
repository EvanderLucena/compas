package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.AuthService;
import com.compas.api.auth.JwtService;
import com.compas.api.auth.RefreshTokenRepository;
import com.compas.api.auth.dto.LoginRequest;
import com.compas.api.auth.dto.SignupRequest;

import java.util.UUID;
import com.compas.api.dto.biometry.CreateBiometryAssessmentRequest;
import com.compas.api.dto.biometry.UpdateBiometryAssessmentRequest;
import com.compas.api.model.*;
import com.compas.api.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BiometryControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private BiometryAssessmentRepository assessmentRepository;
    @Autowired private BiometrySkinfoldRepository skinfoldRepository;
    @Autowired private BiometryPerimetryRepository perimetryRepository;
    @Autowired private EpisodeHistoryEventRepository historyEventRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private EpisodeRepository episodeRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String accessToken;
    private UUID nutritionistId;
    private UUID patientId;
    private UUID episodeId;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        perimetryRepository.deleteAll();
        assessmentRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Test", "nutri@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
        nutritionistId = nutritionistRepository.findByEmail("nutri@test.com").orElseThrow().getId();

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Maria Silva")
                .objective(PatientObjective.EMAGRECIMENTO)
                .weight(new BigDecimal("75.00"))
                .build();
        patient = patientRepository.save(patient);
        patientId = patient.getId();

        Episode episode = Episode.builder()
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.now())
                .build();
        episode = episodeRepository.save(episode);
        episodeId = episode.getId();
    }

    @Test
    void createAssessment_returns200WithEnvelope() throws Exception {
        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assessmentDate").value("2025-01-10"))
                .andExpect(jsonPath("$.data.weight").value(75.00))
                .andExpect(jsonPath("$.data.bodyFatPercent").value(22.50));
    }

    @Test
    void createAssessment_withMissingRequiredFields_returns400() throws Exception {
        String body = """
                {"assessmentDate": "2025-01-10"}
                """;

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAssessment_withBodyFatPercentAbove100_returns400() throws Exception {
        String body = """
                {
                  "assessmentDate": "2025-01-10",
                  "weight": 75.0,
                  "bodyFatPercent": 120.0
                }
                """;

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAssessment_withNegativeSkinfold_returns400() throws Exception {
        String body = """
                {
                  "assessmentDate": "2025-01-10",
                  "weight": 75.0,
                  "bodyFatPercent": 20.0,
                  "skinfolds": [
                    { "measureKey": "triceps", "valueMm": -5.0, "sortOrder": 1 }
                  ]
                }
                """;

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAssessment_returnsUpdatedResponse() throws Exception {
        BiometryAssessment assessment = BiometryAssessment.builder()
                .episodeId(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        assessment = assessmentRepository.save(assessment);

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, new BigDecimal("74.00"), null, null, null, null, null, null, null, null);

        mockMvc.perform(patch("/api/v1/patients/{patientId}/biometry/{assessmentId}", patientId, assessment.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weight").value(74.00));
    }

    @Test
    void updateAssessment_withInvalidSkinfoldPayload_returns400() throws Exception {
        BiometryAssessment assessment = BiometryAssessment.builder()
                .episodeId(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00"))
                .bodyFatPercent(new BigDecimal("22.50"))
                .build();
        assessment = assessmentRepository.save(assessment);

        String body = """
                {
                  "skinfolds": [
                    {
                      "measureKey": "",
                      "valueMm": -1.0,
                      "sortOrder": 0
                    }
                  ]
                }
                """;

        mockMvc.perform(patch("/api/v1/patients/{patientId}/biometry/{assessmentId}", patientId, assessment.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAssessment_withMismatchedRoutePatient_returns404() throws Exception {
        Patient otherPatient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Joana Souza")
                .objective(PatientObjective.HIPERTROFIA)
                .weight(new BigDecimal("68.00"))
                .build();
        otherPatient = patientRepository.save(otherPatient);
        Episode otherEpisode = episodeRepository.save(Episode.builder()
                .patientId(otherPatient.getId())
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.now())
                .build());
        BiometryAssessment assessment = BiometryAssessment.builder()
                .episodeId(otherEpisode.getId())
                .patientId(otherPatient.getId())
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("68.00"))
                .bodyFatPercent(new BigDecimal("20.00"))
                .build();
        assessment = assessmentRepository.save(assessment);

        UpdateBiometryAssessmentRequest req = new UpdateBiometryAssessmentRequest(
                null, new BigDecimal("66.00"), null, null, null, null, null, null, null, null);

        mockMvc.perform(patch("/api/v1/patients/{patientId}/biometry/{assessmentId}", patientId, assessment.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());

        BiometryAssessment unchanged = assessmentRepository.findById(assessment.getId()).orElseThrow();
        assertEquals(new BigDecimal("68.00"), unchanged.getWeight());
    }

    @Test
    void listAssessments_returnsListForActiveEpisode() throws Exception {
        BiometryAssessment a1 = BiometryAssessment.builder()
                .episodeId(episodeId).patientId(patientId).nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("75.00")).bodyFatPercent(new BigDecimal("22.50")).build();
        BiometryAssessment a2 = BiometryAssessment.builder()
                .episodeId(episodeId).patientId(patientId).nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 20))
                .weight(new BigDecimal("74.00")).bodyFatPercent(new BigDecimal("21.80")).build();
        assessmentRepository.save(a1);
        assessmentRepository.save(a2);

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void crossNutritionistAccess_returns404() throws Exception {
        SignupRequest otherSignup = new SignupRequest("Dr. Other", "other@test.com", "senha12345", "54321", "RJ", "Nutrição", null, true);
        authService.signup(otherSignup);
        String otherToken = authService.login(new LoginRequest("other@test.com", "senha12345")).accessToken();

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void createAssessment_persistsHistoryEventWithEventAt() throws Exception {
        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        List<EpisodeHistoryEvent> events = historyEventRepository.findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episodeId, nutritionistId);
        assertEquals(1, events.size());
        assertEquals("EPISODE_BIOMETRY_CREATED", events.get(0).getEventType());
        assertNotNull(events.get(0).getEventAt());
    }

    @Test
    void noActiveEpisode_returns400() throws Exception {
        Episode episode = episodeRepository.findById(episodeId).orElseThrow();
        episode.close();
        episodeRepository.save(episode);

        CreateBiometryAssessmentRequest req = new CreateBiometryAssessmentRequest(
                LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"),
                null, null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/patients/{patientId}/biometry", patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listHistoryEpisodes_returnsOnlyClosedEpisodes() throws Exception {
        episodeRepository.findById(episodeId).orElseThrow().close();
        episodeRepository.save(episodeRepository.findById(episodeId).orElseThrow());

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/history/episodes", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void listHistoryEpisodes_returnsEmptyWhenNoClosedEpisodes() throws Exception {
        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/history/episodes", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void getHistorySnapshot_returnsSnapshotForClosedEpisode() throws Exception {
        Episode episode = episodeRepository.findById(episodeId).orElseThrow();
        episode.close();
        episodeRepository.save(episode);

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/history/episodes/{episodeId}", patientId, episodeId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.episodeId").value(episodeId.toString()));
    }

    @Test
    void getHistorySnapshot_withOtherNutritionistEpisode_returns404() throws Exception {
        SignupRequest otherSignup = new SignupRequest("Dr. Other Snapshot", "snapshot-other@test.com",
                "senha12345", "54322", "RJ", "Nutrição", null, true);
        authService.signup(otherSignup);
        UUID otherNutritionistId = nutritionistRepository.findByEmail("snapshot-other@test.com").orElseThrow().getId();
        Patient otherPatient = patientRepository.save(Patient.builder()
                .nutritionistId(otherNutritionistId)
                .name("Paciente de outro nutri")
                .objective(PatientObjective.EMAGRECIMENTO)
                .weight(new BigDecimal("80.00"))
                .build());
        Episode otherEpisode = episodeRepository.save(Episode.builder()
                .patientId(otherPatient.getId())
                .nutritionistId(otherNutritionistId)
                .startDate(LocalDateTime.of(2025, 1, 1, 0, 0))
                .endDate(LocalDateTime.of(2025, 2, 1, 0, 0))
                .build());

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/history/episodes/{episodeId}",
                        patientId, otherEpisode.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void getHistorySnapshot_returns400ForActiveEpisode() throws Exception {
        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/history/episodes/{episodeId}", patientId, episodeId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getEvolutionSummary_returns200WithEnvelope() throws Exception {
        assessmentRepository.save(BiometryAssessment.builder()
                .patientId(patientId)
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .assessmentDate(LocalDate.of(2025, 1, 10))
                .weight(new BigDecimal("80.00"))
                .bodyFatPercent(new BigDecimal("20.00"))
                .leanMassKg(new BigDecimal("64.00"))
                .build());

        mockMvc.perform(get("/api/v1/patients/{patientId}/biometry/evolution-summary", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assessmentCount").value(1))
                .andExpect(jsonPath("$.data.currentWeight").value(80.00))
                .andExpect(jsonPath("$.data.currentBodyFatPercent").value(20.00))
                .andExpect(jsonPath("$.data.clinicalSynthesis").isString())
                .andExpect(jsonPath("$.data.whatsappFeedbackMessage").isString());
    }
}
