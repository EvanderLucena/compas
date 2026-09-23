package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.AuthService;
import com.compas.api.repository.RefreshTokenRepository;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.food.CreateFoodRequest;
import com.compas.api.dto.patient.CreatePatientRequest;
import com.compas.api.dto.plan.*;
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
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private MealFoodRepository mealFoodRepository;

    @Autowired
    private MealOptionRepository mealOptionRepository;

    @Autowired
    private MealSlotRepository mealSlotRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private PlanExtraRepository planExtraRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String accessToken;
    private String patientId;
    private String foodId;

    @BeforeEach
    void setUp() {
        mealFoodRepository.deleteAll();
        mealOptionRepository.deleteAll();
        mealSlotRepository.deleteAll();
        planExtraRepository.deleteAll();
        mealPlanRepository.deleteAll();
        foodRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest("Dr. Plan", "plan@test.com", "senha12345", "12345", "SP", "Nutrição", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();

        CreatePatientRequest patientReq = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", new BigDecimal("75.00"), true);
        try {
            String patientResponse = mockMvc.perform(post("/api/v1/patients")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(patientReq)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            patientId = objectMapper.readTree(patientResponse).at("/data/id").asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        CreateFoodRequest foodReq = new CreateFoodRequest(
                "Arroz branco", "CARBOIDRATO", "GRAMAS",
                new BigDecimal("100"), new BigDecimal("130.0"), new BigDecimal("2.7"),
                new BigDecimal("28.0"), new BigDecimal("0.3"), null,
                "cozido", null
        );
        try {
            String foodResponse = mockMvc.perform(post("/api/v1/foods")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(foodReq)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            foodId = objectMapper.readTree(foodResponse).at("/data/id").asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void getPlan_returns200WithFullPlanStructure() throws Exception {
        mockMvc.perform(get("/api/v1/patients/" + patientId + "/plan")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Plano alimentar"))
                .andExpect(jsonPath("$.data.meals").isArray())
                .andExpect(jsonPath("$.data.meals.length()").value(6))
                .andExpect(jsonPath("$.data.meals[0].label").value("Café da manhã"))
                .andExpect(jsonPath("$.data.meals[0].options").isArray())
                .andExpect(jsonPath("$.data.meals[0].options[0].name").value("Opção 1 · Clássico"))
                .andExpect(jsonPath("$.data.extras").isArray());
    }

    @Test
    void updatePlan_updatesTargets() throws Exception {
        UpdatePlanRequest req = new UpdatePlanRequest("Novo plano", null, new BigDecimal("2000"), new BigDecimal("100"), null, null);

        mockMvc.perform(patch("/api/v1/patients/" + patientId + "/plan")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Novo plano"))
                .andExpect(jsonPath("$.data.kcalTarget").value(2000))
                .andExpect(jsonPath("$.data.protTarget").value(100));
    }

    @Test
    void addMealSlot_returnsSlotResponse() throws Exception {
        AddMealSlotRequest req = new AddMealSlotRequest("Lanche extra", "16:00");

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/plan/meals")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.label").value("Lanche extra"))
                .andExpect(jsonPath("$.data.time").value("16:00"))
                .andExpect(jsonPath("$.data.options").isArray());
    }

    @Test
    void deleteMealSlot_returns204() throws Exception {
        String planResponse = mockMvc.perform(get("/api/v1/patients/" + patientId + "/plan")
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();

        String mealId = objectMapper.readTree(planResponse).at("/data/meals/0/id").asText();

        mockMvc.perform(delete("/api/v1/patients/" + patientId + "/plan/meals/" + mealId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void addFoodItem_returnsWithCalculatedMacros() throws Exception {
        String planResponse = mockMvc.perform(get("/api/v1/patients/" + patientId + "/plan")
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();

        String mealId = objectMapper.readTree(planResponse).at("/data/meals/0/id").asText();
        String optionId = objectMapper.readTree(planResponse).at("/data/meals/0/options/0/id").asText();

        AddFoodItemRequest req = new AddFoodItemRequest(
                UUID.fromString(foodId), new BigDecimal("200.0")
        );

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/plan/meals/" + mealId + "/options/" + optionId + "/items")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.foodName").value("Arroz branco"))
                .andExpect(jsonPath("$.data.kcal").value(260.0))
                .andExpect(jsonPath("$.data.prot").value(5.4))
                .andExpect(jsonPath("$.data.carb").value(56.0))
                .andExpect(jsonPath("$.data.referenceAmount").value(200.0))
                .andExpect(jsonPath("$.data.unit").value("GRAMAS"));
    }

    @Test
    void addExtra_returnsExtraResponse() throws Exception {
        AddExtraRequest req = new AddExtraRequest("Chá verde", "1 xícara", new BigDecimal("2"), null, null, null);

        mockMvc.perform(post("/api/v1/patients/" + patientId + "/plan/extras")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Chá verde"))
                .andExpect(jsonPath("$.data.kcal").value(2));
    }

    @Test
    void getPlan_returns404ForWrongNutritionist() throws Exception {
        SignupRequest otherReq = new SignupRequest("Other Nutri", "otherplan@test.com", "senha12345", "54321", "RJ", null, null, true);
        var otherResult = authService.signup(otherReq);

        mockMvc.perform(get("/api/v1/patients/" + patientId + "/plan")
                        .header("Authorization", "Bearer " + otherResult.accessToken()))
                .andExpect(status().isNotFound());
    }
}
