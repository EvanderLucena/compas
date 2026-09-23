package com.compas.api.controller;

import com.compas.api.auth.AuthService;
import com.compas.api.repository.RefreshTokenRepository;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.patient.CreatePatientRequest;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.service.PatientDocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PatientDocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @MockBean
    private PatientDocumentService patientDocumentService;

    private String accessToken;
    private String patientId;

    @BeforeEach
    void setUp() throws Exception {
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest(
                "Dra. Camila", "camila.pdf@test.com", "senha12345", "12345", "CRN-3", "Clínica", null, true
        );
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();

        CreatePatientRequest patientReq = new CreatePatientRequest(
                "Carlos Silva", null, null, null, null, "HIPERTROFIA", new BigDecimal("75.00"), true
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
    @DisplayName("GET /api/v1/patients/{patientId}/documents/meal-plan/pdf returns 200 and application/pdf")
    void getMealPlanPdf_authenticated_returns200() throws Exception {
        byte[] dummyPdf = "%PDF-1.4 dummy meal plan content".getBytes(StandardCharsets.US_ASCII);
        when(patientDocumentService.generateMealPlanPdf(any(UUID.class), any(UUID.class)))
                .thenReturn(dummyPdf);

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/documents/meal-plan/pdf")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"plano-alimentar-" + patientId + ".pdf\""))
                .andExpect(content().bytes(dummyPdf));
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/documents/grocery-list/pdf returns 200 and application/pdf")
    void getGroceryListPdf_authenticated_returns200() throws Exception {
        byte[] dummyPdf = "%PDF-1.4 dummy grocery list content".getBytes(StandardCharsets.US_ASCII);
        when(patientDocumentService.generateGroceryListPdf(any(UUID.class), any(UUID.class)))
                .thenReturn(dummyPdf);

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/documents/grocery-list/pdf")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"lista-compras-" + patientId + ".pdf\""))
                .andExpect(content().bytes(dummyPdf));
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/documents/biometry/pdf returns 200 and application/pdf")
    void getBiometryReportPdf_authenticated_returns200() throws Exception {
        byte[] dummyPdf = "%PDF-1.4 dummy biometry content".getBytes(StandardCharsets.US_ASCII);
        when(patientDocumentService.generateBiometryReportPdf(any(UUID.class), any(UUID.class)))
                .thenReturn(dummyPdf);

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/documents/biometry/pdf")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"relatorio-biometrico-" + patientId + ".pdf\""))
                .andExpect(content().bytes(dummyPdf));
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/documents/meal-plan/pdf unauthenticated returns 401")
    void getMealPlanPdf_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/patients/" + patientId + "/documents/meal-plan/pdf"))
                .andExpect(status().isUnauthorized());
    }
}
