package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.AuthService;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.patient.CreatePatientRequest;
import com.compas.api.dto.substitution.FoodSubstitutionItemResponse;
import com.compas.api.dto.substitution.FoodSubstitutionRequest;
import com.compas.api.dto.substitution.FoodSubstitutionResponse;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.RefreshTokenRepository;
import com.compas.api.service.FoodSubstitutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FoodSubstitutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private PatientRepository patientRepository;

    @MockBean
    private FoodSubstitutionService foodSubstitutionService;

    private String accessToken;
    private String patientId;

    @BeforeEach
    void setUp() throws Exception {
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        String email = "subnutri." + UUID.randomUUID() + "@example.com";
        SignupRequest signupReq = new SignupRequest(
                "Dra. Substituicao", email, "senha12345",
                "88990", "CRN-3", "Nutrição Clínica", null, true
        );
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();

        CreatePatientRequest patientReq = new CreatePatientRequest(
                "Lucas Ferreira", null, null, null, null, "HIPERTROFIA", new BigDecimal("82.00"), true
        );

        String patientResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patientReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        patientId = objectMapper.readTree(patientResponse).path("data").path("id").asText();
    }

    @Test
    void calculateForPatient_validRequest_returns200AndSubstitutions() throws Exception {
        UUID foodId = UUID.randomUUID();
        FoodSubstitutionItemResponse itemResp = new FoodSubstitutionItemResponse(
                UUID.randomUUID(),
                "Batata doce cozida",
                "CARBOIDRATO",
                "GRAMAS",
                BigDecimal.valueOf(180),
                "180g (1 unidade média)",
                BigDecimal.valueOf(138.6),
                BigDecimal.valueOf(1.1),
                BigDecimal.valueOf(33.1),
                BigDecimal.valueOf(0.2),
                BigDecimal.valueOf(4.0),
                BigDecimal.valueOf(8.6),
                BigDecimal.valueOf(-1.6),
                BigDecimal.valueOf(4.9),
                BigDecimal.ZERO,
                true,
                3,
                "Consumido 3x recentemente",
                95,
                "Equivalência de carboidratos com variação mínima"
        );

        FoodSubstitutionResponse response = new FoodSubstitutionResponse(
                "Arroz branco cozido",
                BigDecimal.valueOf(150),
                "GRAMAS",
                BigDecimal.valueOf(195.0),
                BigDecimal.valueOf(4.0),
                BigDecimal.valueOf(42.3),
                BigDecimal.valueOf(0.3),
                "CARBOIDRATO",
                List.of(itemResp),
                "Olá! Aqui estão suas opções..."
        );

        when(foodSubstitutionService.calculateSubstitutionsForPatient(any(UUID.class), eq(UUID.fromString(patientId)), any(FoodSubstitutionRequest.class)))
                .thenReturn(response);

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                foodId,
                null,
                BigDecimal.valueOf(150),
                null,
                null,
                null,
                null,
                null,
                null,
                5
        );

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/food-substitutions")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sourceFoodName").value("Arroz branco cozido"))
                .andExpect(jsonPath("$.data.dominantMacro").value("CARBOIDRATO"))
                .andExpect(jsonPath("$.data.substitutions[0].name").value("Batata doce cozida"))
                .andExpect(jsonPath("$.data.substitutions[0].isPatientHabit").value(true));
    }

    @Test
    void calculateGeneral_validRequest_returns200() throws Exception {
        FoodSubstitutionResponse response = new FoodSubstitutionResponse(
                "Arroz branco cozido",
                BigDecimal.valueOf(100),
                "GRAMAS",
                BigDecimal.valueOf(130.0),
                BigDecimal.valueOf(2.7),
                BigDecimal.valueOf(28.2),
                BigDecimal.valueOf(0.2),
                "CARBOIDRATO",
                List.of(),
                "Mensagem..."
        );

        when(foodSubstitutionService.calculateGeneralSubstitutions(any(UUID.class), any(FoodSubstitutionRequest.class)))
                .thenReturn(response);

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                UUID.randomUUID(),
                null,
                BigDecimal.valueOf(100),
                null,
                null,
                null,
                null,
                null,
                null,
                5
        );

        mockMvc.perform(post("/api/v1/food-substitutions/calculate")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sourceFoodName").value("Arroz branco cozido"));
    }

    @Test
    void calculateForPatient_unauthenticated_returns401() throws Exception {
        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                UUID.randomUUID(), null, BigDecimal.valueOf(100), null, null, null, null, null, null, 5);

        mockMvc.perform(post("/api/v1/patients/" + UUID.randomUUID() + "/food-substitutions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
