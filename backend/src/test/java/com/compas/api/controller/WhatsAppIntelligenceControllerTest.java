package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.AuthService;
import com.compas.api.auth.JwtService;
import com.compas.api.repository.RefreshTokenRepository;
import com.compas.api.auth.dto.LoginRequest;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.whatsapp.PatchExtractionRequest;
import com.compas.api.model.*;
import com.compas.api.repository.*;
import com.compas.api.service.WhatsAppFleetService;

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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WhatsAppIntelligenceControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AuthService authService;
    @Autowired private MealExtractionRepository mealExtractionRepository;
    @Autowired private ExtractionItemRepository extractionItemRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private EpisodeRepository episodeRepository;
    @Autowired private WhatsAppMessageRepository whatsAppMessageRepository;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private WhatsAppInstanceRepository instanceRepository;
    @Autowired private WhatsAppFleetService whatsAppFleetService;

    private String accessToken;
    private UUID nutritionistId;
    private UUID patientId;
    private UUID episodeId;

    @BeforeEach
    void setUp() {
        extractionItemRepository.deleteAll();
        mealExtractionRepository.deleteAll();
        whatsAppMessageRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        instanceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Test WA", "wa-test@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
        nutritionistId = nutritionistRepository.findByEmail("wa-test@test.com").orElseThrow().getId();

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Maria Teste")
                .whatsapp("11999887766")
                .objective(PatientObjective.EMAGRECIMENTO)
                .weight(new BigDecimal("70.00"))
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
    void getExtractionsToday_returnsListForToday() throws Exception {
        // Create an extraction for today
        MealExtraction extraction = MealExtraction.builder()
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Almoço: arroz, feijão, frango")
                .mealLabel("Almoço")
                .totalKcal(new BigDecimal("650.0"))
                .totalProt(new BigDecimal("35.0"))
                .totalCarb(new BigDecimal("80.0"))
                .totalFat(new BigDecimal("15.0"))
                .extractedAt(LocalDateTime.now())
                .build();
        mealExtractionRepository.save(extraction);

        ExtractionItem item = ExtractionItem.builder()
                .extractionId(extraction.getId())
                .name("Arroz com feijão")
                .kcal(new BigDecimal("400.0"))
                .prot(new BigDecimal("15.0"))
                .carb(new BigDecimal("60.0"))
                .fat(new BigDecimal("5.0"))
                .grams(new BigDecimal("250.0"))
                .sortOrder(0)
                .build();
        extractionItemRepository.save(item);

        mockMvc.perform(get("/api/v1/patients/{patientId}/extractions", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].mealLabel").value("Almoço"))
                .andExpect(jsonPath("$.data[0].items.length()").value(1))
                .andExpect(jsonPath("$.data[0].totalKcal").value(650.0));
    }

    @Test
    void getExtractions_withPastDate_returnsListForThatDate() throws Exception {
        LocalDate pastDate = LocalDate.now().minusDays(5);
        MealExtraction pastExtraction = MealExtraction.builder()
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Jantar: sopa de legumes")
                .mealLabel("Jantar")
                .totalKcal(new BigDecimal("220.0"))
                .totalProt(new BigDecimal("12.0"))
                .totalCarb(new BigDecimal("30.0"))
                .totalFat(new BigDecimal("4.0"))
                .extractedAt(pastDate.atTime(19, 30))
                .build();
        mealExtractionRepository.save(pastExtraction);

        mockMvc.perform(get("/api/v1/patients/{patientId}/extractions", patientId)
                        .param("date", pastDate.toString())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].mealLabel").value("Jantar"))
                .andExpect(jsonPath("$.data[0].totalKcal").value(220.0));
    }

    @Test
    void getExtractionsToday_wrongTenant_returns404() throws Exception {
        // Create a second nutritionist
        SignupRequest otherSignup = new SignupRequest("Dr. Other WA", "wa-other@test.com", "senha12345", "54321", "RJ", "Nutrição", null, true);
        authService.signup(otherSignup);
        String otherToken = authService.login(new LoginRequest("wa-other@test.com", "senha12345")).accessToken();

        // First nutritionist's patient — second nutritionist should get 404
        mockMvc.perform(get("/api/v1/patients/{patientId}/extractions", patientId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void correctExtraction_updatesItemsAndTotals() throws Exception {
        // Create an extraction
        MealExtraction extraction = MealExtraction.builder()
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Café da manhã: pão com manteiga")
                .mealLabel("Café da manhã")
                .totalKcal(new BigDecimal("300.0"))
                .totalProt(new BigDecimal("8.0"))
                .totalCarb(new BigDecimal("35.0"))
                .totalFat(new BigDecimal("12.0"))
                .extractedAt(LocalDateTime.now())
                .build();
        extraction = mealExtractionRepository.save(extraction);

        ExtractionItem originalItem = ExtractionItem.builder()
                .extractionId(extraction.getId())
                .name("Pão com manteiga")
                .kcal(new BigDecimal("300.0"))
                .prot(new BigDecimal("8.0"))
                .carb(new BigDecimal("35.0"))
                .fat(new BigDecimal("12.0"))
                .grams(new BigDecimal("80.0"))
                .sortOrder(0)
                .build();
        extractionItemRepository.save(originalItem);

        // PATCH with corrected items
        PatchExtractionRequest request = new PatchExtractionRequest(List.of(
                new PatchExtractionRequest.PatchExtractionItem(
                        "Pão integral com manteiga", new BigDecimal("280.0"), new BigDecimal("10.0"),
                        new BigDecimal("30.0"), new BigDecimal("11.0"), new BigDecimal("85.0")),
                new PatchExtractionRequest.PatchExtractionItem(
                        "Café preto", new BigDecimal("5.0"), new BigDecimal("0.5"),
                        new BigDecimal("1.0"), new BigDecimal("0.0"), null)
        ));

        mockMvc.perform(patch("/api/v1/patients/{patientId}/extractions/{extractionId}", patientId, extraction.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalKcal").value(285.0))
                .andExpect(jsonPath("$.data.totalProt").value(10.5));

        // Verify items were replaced in DB
        List<ExtractionItem> newItems = extractionItemRepository.findByExtractionIdOrderBySortOrder(extraction.getId());
        assertEquals(2, newItems.size());
        assertEquals("Pão integral com manteiga", newItems.get(0).getName());
    }

    @Test
    void correctExtraction_notFound_returns404() throws Exception {
        UUID randomExtractionId = UUID.randomUUID();

        PatchExtractionRequest request = new PatchExtractionRequest(List.of(
                new PatchExtractionRequest.PatchExtractionItem(
                        "Test", BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null)
        ));

        mockMvc.perform(patch("/api/v1/patients/{patientId}/extractions/{extractionId}", patientId, randomExtractionId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getActivationLink_returnsLinkForPatientWithPhone() throws Exception {
        mockMvc.perform(get("/api/v1/patients/{patientId}/activation-link", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.link").value("https://wa.me/5511999887766?text=Oi"))
                .andExpect(jsonPath("$.data.phone").value("11999887766"))
                .andExpect(jsonPath("$.data.isActivated").value(false));
    }

    @Test
    void getActivationLink_patientWithoutPhone_returns400() throws Exception {
        // Create a patient without WhatsApp number
        Patient noPhonePatient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Sem WhatsApp")
                .objective(PatientObjective.SAUDE_GERAL)
                .weight(new BigDecimal("65.00"))
                .build();
        noPhonePatient = patientRepository.save(noPhonePatient);

        mockMvc.perform(get("/api/v1/patients/{patientId}/activation-link", noPhonePatient.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("WhatsApp não cadastrado"));
    }

    @Test
    void getActivationLink_withFleetInstances_autoFailsOverWhenInstanceBanned() throws Exception {
        // 1. Setup Chip A (primary) and Chip B (healthy backup)
        WhatsAppInstance chipA = instanceRepository.save(WhatsAppInstance.builder()
                .name("compas-chip-a")
                .phoneNumber("5511999990001")
                .status(WhatsAppInstanceStatus.CONNECTED)
                .maxPatients(100)
                .active(true)
                .build());

        WhatsAppInstance chipB = instanceRepository.save(WhatsAppInstance.builder()
                .name("compas-chip-b")
                .phoneNumber("5511999990002")
                .status(WhatsAppInstanceStatus.CONNECTED)
                .maxPatients(100)
                .active(true)
                .build());

        // 2. Patient requests activation link -> assigned to Chip A
        mockMvc.perform(get("/api/v1/patients/{patientId}/activation-link", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.link").value("https://wa.me/5511999990001?text=Oi"));

        // 3. Chip A is marked BANNED via updateInstance (which triggers autoFailover)
        whatsAppFleetService.updateInstance(chipA.getId(),
                new com.compas.api.dto.whatsapp.fleet.UpdateWhatsAppInstanceRequest(
                        null, null, null, null, WhatsAppInstanceStatus.BANNED));

        // 4. Patient requests activation link again -> should automatically point to Chip B!
        mockMvc.perform(get("/api/v1/patients/{patientId}/activation-link", patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.link").value("https://wa.me/5511999990002?text=Oi"));
    }

    @Test
    void getWhatsAppStatus_returnsStatus() throws Exception {
        // Create a processed WhatsApp message for this nutritionist's patient
        WhatsAppMessage msg = WhatsAppMessage.builder()
                .messageId("msg-status-test-001")
                .instanceId("test-instance")
                .senderPhone("11999887766")
                .senderPhoneNormalized("11999887766")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageContent("Comi arroz e feijão")
                .processed(true)
                .build();
        whatsAppMessageRepository.save(msg);

        // Create an extraction for today
        MealExtraction extraction = MealExtraction.builder()
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Teste status")
                .mealLabel("Almoço")
                .totalKcal(new BigDecimal("500.0"))
                .totalProt(new BigDecimal("25.0"))
                .totalCarb(new BigDecimal("50.0"))
                .totalFat(new BigDecimal("10.0"))
                .extractedAt(LocalDateTime.now())
                .build();
        mealExtractionRepository.save(extraction);

        mockMvc.perform(get("/api/v1/whatsapp/status")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.extractionsToday").value(1))
                .andExpect(jsonPath("$.data.activePatientsCount").value(1))
                .andExpect(jsonPath("$.data.connected").value(true));
    }
}