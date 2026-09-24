package com.compas.api.controller;

import com.compas.api.auth.AuthService;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.patient.CreatePatientRequest;
import com.compas.api.dto.prescription.CreatePrescriptionRequest;
import com.compas.api.dto.prescription.PrescriptionCatalogItemResponse;
import com.compas.api.dto.prescription.PrescriptionItemRequest;
import com.compas.api.dto.prescription.PrescriptionItemResponse;
import com.compas.api.dto.prescription.PrescriptionResponse;
import com.compas.api.model.PrescriptionCategory;
import com.compas.api.model.PrescriptionStatus;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.RefreshTokenRepository;
import com.compas.api.service.PrescriptionService;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PrescriptionControllerTest {

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
    private PrescriptionService prescriptionService;

    private String accessToken;
    private String patientId;

    @BeforeEach
    void setUp() throws Exception {
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest(
                "Dra. Marina Prescricao", "marina.rx@test.com", "senha12345",
                "54321", "CRN-3", "Nutrição Clínica", null, true
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
    @DisplayName("GET /api/v1/patients/{patientId}/prescriptions returns 200 and list")
    void listPrescriptions_returns200() throws Exception {
        UUID rxId = UUID.randomUUID();
        PrescriptionResponse resp = new PrescriptionResponse(
                rxId,
                UUID.fromString(patientId),
                "Lucas Ferreira",
                "Prescrição Inicial",
                "Observações",
                PrescriptionStatus.ACTIVE,
                "Ativa",
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of(),
                0,
                "Resumo",
                "WhatsApp"
        );

        when(prescriptionService.listPrescriptions(any(UUID.class), eq(UUID.fromString(patientId))))
                .thenReturn(List.of(resp));

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/prescriptions")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Prescrição Inicial"));
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/prescriptions/catalog returns clinical supplement library")
    void getCatalog_returns200() throws Exception {
        when(prescriptionService.getSupplementLibrary()).thenReturn(List.of(
                new PrescriptionCatalogItemResponse(
                        "creatina",
                        "Creatina Monohidratada",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "5g",
                        "Pó",
                        "Pós-treino",
                        "Uso contínuo",
                        true,
                        "Com água",
                        "Força muscular"
                )
        ));

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/prescriptions/catalog")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Creatina Monohidratada"));
    }

    @Test
    @DisplayName("POST /api/v1/patients/{patientId}/prescriptions creates new prescription and returns 201")
    void createPrescription_returns201() throws Exception {
        UUID rxId = UUID.randomUUID();
        PrescriptionResponse resp = new PrescriptionResponse(
                rxId,
                UUID.fromString(patientId),
                "Lucas Ferreira",
                "Suplementação Esportiva",
                null,
                PrescriptionStatus.ACTIVE,
                "Ativa",
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of(new PrescriptionItemResponse(
                        UUID.randomUUID(),
                        rxId,
                        "Creatina",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "5g",
                        "Pó",
                        "Pós-treino",
                        "Uso contínuo",
                        true,
                        null,
                        0
                )),
                1,
                "Resumo",
                "WhatsApp"
        );

        when(prescriptionService.createPrescription(any(UUID.class), eq(UUID.fromString(patientId)), any()))
                .thenReturn(resp);

        CreatePrescriptionRequest request = new CreatePrescriptionRequest(
                "Suplementação Esportiva",
                null,
                PrescriptionStatus.ACTIVE,
                List.of(new PrescriptionItemRequest(
                        "Creatina",
                        PrescriptionCategory.SUPPLEMENT,
                        "5g",
                        "Pó",
                        "Pós-treino",
                        "Uso contínuo",
                        true,
                        null,
                        0
                ))
        );

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/prescriptions")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Suplementação Esportiva"))
                .andExpect(jsonPath("$.data.items[0].name").value("Creatina"));
    }

    @Test
    @DisplayName("DELETE /api/v1/patients/{patientId}/prescriptions/{prescriptionId} returns 204")
    void deletePrescription_returns204() throws Exception {
        UUID rxId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/patients/" + patientId + "/prescriptions/" + rxId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/prescriptions/{prescriptionId}/pdf returns 200 and application/pdf")
    void getPrescriptionPdf_returns200() throws Exception {
        UUID rxId = UUID.randomUUID();
        byte[] dummyPdf = "%PDF-1.4 dummy prescription".getBytes(StandardCharsets.US_ASCII);
        when(prescriptionService.generatePrescriptionPdf(any(UUID.class), eq(UUID.fromString(patientId)), eq(rxId)))
                .thenReturn(dummyPdf);

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/prescriptions/" + rxId + "/pdf")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"receituario-suplementacao-" + rxId + ".pdf\""))
                .andExpect(content().bytes(dummyPdf));
    }

    @Test
    @DisplayName("GET /api/v1/patients/{patientId}/prescriptions without auth returns 401")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/patients/" + patientId + "/prescriptions"))
                .andExpect(status().isUnauthorized());
    }
}
