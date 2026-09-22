package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.AuthService;
import com.compas.api.auth.RefreshTokenRepository;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.model.*;
import com.compas.api.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DashboardControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthService authService;
    @Autowired private PatientRepository patientRepository;
    @Autowired private EpisodeRepository episodeRepository;
    @Autowired private BiometryAssessmentRepository assessmentRepository;
    @Autowired private BiometrySkinfoldRepository skinfoldRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String accessToken;
    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        assessmentRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Dashboard", "dash@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
        nutritionistId = nutritionistRepository.findByEmail("dash@test.com").orElseThrow().getId();
    }

    @Test
    void getDashboard_returns200WithEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.kpis.activePatients").value(0));
    }

    @Test
    void getDashboard_returnsPatientCounts() throws Exception {
        Patient p1 = Patient.builder().nutritionistId(nutritionistId).name("Maria")
                .objective(PatientObjective.EMAGRECIMENTO).status(PatientStatus.ONTRACK).active(true).build();
        Patient p2 = Patient.builder().nutritionistId(nutritionistId).name("Jose")
                .objective(PatientObjective.EMAGRECIMENTO).status(PatientStatus.WARNING).active(true).build();
        patientRepository.save(p1);
        patientRepository.save(p2);

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kpis.activePatients").value(2))
                .andExpect(jsonPath("$.data.kpis.attentionPatients").value(1));
    }

    @Test
    void getDashboard_ignoresOtherNutritionistPatients() throws Exception {
        SignupRequest otherSignup = new SignupRequest(
                "Dr. Other",
                "other-dashboard@test.com",
                "senha12345",
                "54321",
                "SP",
                "Nutrição",
                null,
                true);
        authService.signup(otherSignup);
        UUID otherNutritionistId = nutritionistRepository.findByEmail("other-dashboard@test.com")
                .orElseThrow()
                .getId();

        Patient otherPatient = patientRepository.save(Patient.builder()
                .nutritionistId(otherNutritionistId)
                .name("Paciente Intruso")
                .objective(PatientObjective.EMAGRECIMENTO)
                .status(PatientStatus.ONTRACK)
                .active(true)
                .build());

        Episode otherEpisode = episodeRepository.save(Episode.builder()
                .patientId(otherPatient.getId())
                .nutritionistId(otherNutritionistId)
                .startDate(LocalDateTime.now())
                .build());

        assessmentRepository.save(BiometryAssessment.builder()
                .patientId(otherPatient.getId())
                .episodeId(otherEpisode.getId())
                .nutritionistId(otherNutritionistId)
                .assessmentDate(LocalDate.now())
                .weight(new BigDecimal("81.2"))
                .bodyFatPercent(new BigDecimal("27.4"))
                .build());

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kpis.activePatients").value(0))
                .andExpect(jsonPath("$.data.recentEvaluations").isEmpty());
    }

    @Test
    void getDashboard_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
