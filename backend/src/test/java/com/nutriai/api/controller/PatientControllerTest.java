package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.auth.AuthService;
import com.nutriai.api.auth.JwtService;
import com.nutriai.api.auth.RefreshTokenRepository;
import com.nutriai.api.auth.dto.SignupRequest;
import com.nutriai.api.dto.patient.CreatePatientRequest;
import com.nutriai.api.dto.patient.UpdatePatientRequest;
import com.nutriai.api.model.Nutritionist;
import com.nutriai.api.model.UserRole;
import com.nutriai.api.repository.EpisodeRepository;
import com.nutriai.api.repository.MealFoodRepository;
import com.nutriai.api.repository.MealOptionRepository;
import com.nutriai.api.repository.MealPlanRepository;
import com.nutriai.api.repository.MealSlotRepository;
import com.nutriai.api.repository.NutritionistRepository;
import com.nutriai.api.repository.PatientRepository;
import com.nutriai.api.repository.PlanExtraRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PatientControllerTest {

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
    private MealFoodRepository mealFoodRepository;

    @Autowired
    private MealOptionRepository mealOptionRepository;

    @Autowired
    private MealSlotRepository mealSlotRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private PlanExtraRepository planExtraRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String accessToken;

    @BeforeEach
    void setUp() {
        mealFoodRepository.deleteAll();
        mealOptionRepository.deleteAll();
        mealSlotRepository.deleteAll();
        planExtraRepository.deleteAll();
        mealPlanRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Test", "nutri@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
    }

    @Test
    void createPatient_returns201() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", new BigDecimal("75.00"), true);

        mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Maria Silva"))
                .andExpect(jsonPath("$.data.objective").value("EMAGRECIMENTO"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void createPatient_requiresLgpdConsent() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", new BigDecimal("75.00"), false);

        mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Erro de validação"))
                .andExpect(jsonPath("$.errors[0].field").value("terms"))
                .andExpect(jsonPath("$.errors[0].message").value("Consentimento LGPD é obrigatório"));
    }

    @Test
    void createPatient_withFutureBirthDate_returns400() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest(
                "Maria Silva",
                java.time.LocalDate.now().plusDays(2),
                "F",
                165,
                "11999999999",
                "EMAGRECIMENTO",
                new BigDecimal("75.00"),
                true
        );

        mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Erro de validação"));
    }

    @Test
    void createPatient_withZeroWeight_returns400() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest(
                "Maria Silva",
                null,
                "F",
                165,
                "11999999999",
                "EMAGRECIMENTO",
                new BigDecimal("0.00"),
                true
        );

        mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void listPatients_returnsPaginatedList() throws Exception {
        CreatePatientRequest req1 = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        CreatePatientRequest req2 = new CreatePatientRequest("José Santos", null, null, null, null, "HIPERTROFIA", null, true);

        mockMvc.perform(post("/api/v1/patients").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req1)));
        mockMvc.perform(post("/api/v1/patients").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(req2)));

        mockMvc.perform(get("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void getPatient_returnsPatientDetail() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        String createResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(get("/api/v1/patients/" + patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Maria Silva"));
    }

    @Test
    void updatePatient_updatesFields() throws Exception {
        CreatePatientRequest createReq = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        String createResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientId = objectMapper.readTree(createResponse).at("/data/id").asText();
        UpdatePatientRequest updateReq = new UpdatePatientRequest("Ana Costa", null, null, null, null, null, "WARNING", null, null, null, null);

        mockMvc.perform(patch("/api/v1/patients/" + patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Ana Costa"))
                .andExpect(jsonPath("$.data.status").value("WARNING"));
    }

    @Test
    void deactivatePatient_setsActiveFalse() throws Exception {
        CreatePatientRequest createReq = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        String createResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(patch("/api/v1/patients/" + patientId + "/deactivate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    void reactivatePatient_setsActiveTrue() throws Exception {
        CreatePatientRequest createReq = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        String createResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(patch("/api/v1/patients/" + patientId + "/deactivate")
                        .header("Authorization", "Bearer " + accessToken));

        mockMvc.perform(patch("/api/v1/patients/" + patientId + "/reactivate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void listPatients_forbidsAdminRole() throws Exception {
        Nutritionist admin = nutritionistRepository.save(Nutritionist.builder()
                .name("Admin User")
                .email("admin@role-test.com")
                .passwordHash(passwordEncoder.encode("senha12345"))
                .crn("99999")
                .crnRegional("SP")
                .role(UserRole.ADMIN)
                .onboardingCompleted(true)
                .subscriptionTier("UNLIMITED")
                .patientLimit(9999)
                .build());

        String adminToken = jwtService.generateAccessToken(admin);

        mockMvc.perform(get("/api/v1/patients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPatient_returns404ForOtherNutritionist() throws Exception {
        SignupRequest otherNutriReq = new SignupRequest("Other Nutri", "other@test.com", "senha12345", "54321", "RJ", null, null, true);
        var otherResult = authService.signup(otherNutriReq);

        CreatePatientRequest createReq = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", null, true);
        String createResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientId = objectMapper.readTree(createResponse).at("/data/id").asText();

        mockMvc.perform(get("/api/v1/patients/" + patientId)
                        .header("Authorization", "Bearer " + otherResult.accessToken()))
                .andExpect(status().isNotFound());
    }
}
