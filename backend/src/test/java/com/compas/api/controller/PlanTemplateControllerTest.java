package com.compas.api.controller;

import com.compas.api.auth.AuthService;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.dto.patient.CreatePatientRequest;
import com.compas.api.dto.plantemplate.CreatePlanTemplateRequest;
import com.compas.api.dto.plantemplate.PlanTemplateExtraDto;
import com.compas.api.dto.plantemplate.PlanTemplateItemDto;
import com.compas.api.dto.plantemplate.PlanTemplateMealDto;
import com.compas.api.dto.plantemplate.PlanTemplateOptionDto;
import com.compas.api.dto.plantemplate.SavePlanAsTemplateRequest;
import com.compas.api.model.PlanTemplate;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.MealFoodRepository;
import com.compas.api.repository.MealOptionRepository;
import com.compas.api.repository.MealPlanRepository;
import com.compas.api.repository.MealSlotRepository;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.PlanExtraRepository;
import com.compas.api.repository.PlanTemplateRepository;
import com.compas.api.repository.RefreshTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlanTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private PlanTemplateRepository planTemplateRepository;

    @Autowired
    private MealFoodRepository mealFoodRepository;

    @Autowired
    private MealOptionRepository mealOptionRepository;

    @Autowired
    private MealSlotRepository mealSlotRepository;

    @Autowired
    private PlanExtraRepository planExtraRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    private String accessToken;
    private String patientId;

    @BeforeEach
    void setUp() throws Exception {
        planTemplateRepository.deleteAll();
        mealFoodRepository.deleteAll();
        mealOptionRepository.deleteAll();
        mealSlotRepository.deleteAll();
        planExtraRepository.deleteAll();
        mealPlanRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest(
                "Dra. Template", "template@test.com", "senha12345", "99887", "SP", "Clínica", null, true);
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();

        CreatePatientRequest patientReq = new CreatePatientRequest(
                "Carlos Souza", null, null, null, null, "HIPERTROFIA", new BigDecimal("80.00"), true);
        String patientResponse = mockMvc.perform(post("/api/v1/patients")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patientReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        patientId = objectMapper.readTree(patientResponse).at("/data/id").asText();
    }

    @Test
    void listTemplates_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/plan-templates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listTemplates_withAuth_returnsList() throws Exception {
        mockMvc.perform(get("/api/v1/plan-templates")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void createTemplate_validPayload_returns201() throws Exception {
        CreatePlanTemplateRequest req = new CreatePlanTemplateRequest(
                "Modelo Cetogênico",
                "Dieta cetogênica balanceada",
                "CETOGENICA",
                new BigDecimal("1800"),
                new BigDecimal("120"),
                new BigDecimal("30"),
                new BigDecimal("130"),
                List.of(new PlanTemplateMealDto(
                        "Café da manhã",
                        "08:00",
                        0,
                        List.of(new PlanTemplateOptionDto(
                                "Ovos com abacate",
                                0,
                                List.of(new PlanTemplateItemDto(
                                        null, "Ovo mexido", new BigDecimal("2"), "UNIDADE",
                                        new BigDecimal("160"), new BigDecimal("12"),
                                        new BigDecimal("1"), new BigDecimal("12"), null, 0
                                ))
                        ))
                )),
                List.of(new PlanTemplateExtraDto(
                        "Café preto", "1 xícara", BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, BigDecimal.ZERO, 0
                ))
        );

        mockMvc.perform(post("/api/v1/plan-templates")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Modelo Cetogênico"))
                .andExpect(jsonPath("$.data.category").value("CETOGENICA"))
                .andExpect(jsonPath("$.data.meals[0].label").value("Café da manhã"))
                .andExpect(jsonPath("$.data.extras[0].name").value("Café preto"));
    }

    @Test
    void savePlanAsTemplate_andApplyToPatient_successFlow() throws Exception {
        SavePlanAsTemplateRequest saveReq = new SavePlanAsTemplateRequest(
                "Modelo do Carlos", "Baseado no plano atual", "HIPERTROFIA"
        );

        String saveResponse = mockMvc.perform(post("/api/v1/plan-templates/save-from-patient/" + patientId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Modelo do Carlos"))
                .andReturn().getResponse().getContentAsString();

        String templateId = objectMapper.readTree(saveResponse).at("/data/id").asText();

        // Now apply this template to patient
        mockMvc.perform(post("/api/v1/plan-templates/" + templateId + "/apply-to-patient/" + patientId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteTemplate_systemTemplate_returns403() throws Exception {
        PlanTemplate systemTmpl = planTemplateRepository.save(PlanTemplate.builder()
                .name("Sistema Dieta")
                .isSystem(true)
                .kcalTarget(new BigDecimal("2000"))
                .structureJson("{\"meals\":[],\"extras\":[]}")
                .build());

        mockMvc.perform(delete("/api/v1/plan-templates/" + systemTmpl.getId())
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteTemplate_customTemplate_returns200() throws Exception {
        CreatePlanTemplateRequest req = new CreatePlanTemplateRequest(
                "Para Deletar", null, "GERAL", new BigDecimal("2000"),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(), List.of()
        );

        String createResp = mockMvc.perform(post("/api/v1/plan-templates")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String templateId = objectMapper.readTree(createResp).at("/data/id").asText();

        mockMvc.perform(delete("/api/v1/plan-templates/" + templateId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
