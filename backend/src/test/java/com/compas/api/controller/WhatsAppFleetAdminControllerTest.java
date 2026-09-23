package com.compas.api.controller;

import com.compas.api.auth.JwtService;
import com.compas.api.dto.whatsapp.fleet.CreateWhatsAppInstanceRequest;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.UserRole;
import com.compas.api.model.WhatsAppInstance;
import com.compas.api.model.WhatsAppInstanceStatus;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.WhatsAppInstanceRepository;
import com.compas.api.service.EvolutionApiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WhatsAppFleetAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private WhatsAppInstanceRepository instanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EvolutionApiService evolutionApiService;

    private String adminToken;
    private String nutriToken;

    @BeforeEach
    void setUp() {
        Nutritionist admin = nutritionistRepository.save(Nutritionist.builder()
                .name("Admin Frota")
                .email("admin-fleet-test-" + UUID.randomUUID() + "@compas.app")
                .passwordHash(passwordEncoder.encode("senha123"))
                .crn("11111")
                .crnRegional("SP")
                .role(UserRole.ADMIN)
                .emailVerified(true)
                .onboardingCompleted(true)
                .subscriptionTier("UNLIMITED")
                .patientLimit(9999)
                .build());

        Nutritionist nutri = nutritionistRepository.save(Nutritionist.builder()
                .name("Nutri Teste")
                .email("nutri-fleet-test-" + UUID.randomUUID() + "@compas.app")
                .passwordHash(passwordEncoder.encode("senha123"))
                .crn("22222")
                .crnRegional("SP")
                .role(UserRole.NUTRITIONIST)
                .emailVerified(true)
                .onboardingCompleted(true)
                .subscriptionTier("PRO")
                .patientLimit(50)
                .build());

        adminToken = jwtService.generateAccessToken(admin);
        nutriToken = jwtService.generateAccessToken(nutri);
    }

    @Test
    void listInstances_asAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/whatsapp/instances")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void listInstances_asNutritionist_returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/whatsapp/instances")
                        .header("Authorization", "Bearer " + nutriToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void listInstances_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/whatsapp/instances"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createInstance_asAdmin_returns201Created() throws Exception {
        CreateWhatsAppInstanceRequest request = new CreateWhatsAppInstanceRequest(
                "chip-teste-" + System.currentTimeMillis(),
                "5511999998888",
                "Chip de Teste",
                150
        );

        mockMvc.perform(post("/api/v1/admin/whatsapp/instances")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(request.name()))
                .andExpect(jsonPath("$.data.maxPatients").value(150));
    }

    @Test
    void getSummary_asAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/whatsapp/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalInstances").isNumber());
    }

    @Test
    void deleteInstance_asAdmin_returns200() throws Exception {
        when(evolutionApiService.deleteInstance(anyString())).thenReturn(true);

        WhatsAppInstance inst = instanceRepository.save(WhatsAppInstance.builder()
                .name("to-delete-" + System.currentTimeMillis())
                .status(WhatsAppInstanceStatus.DISCONNECTED)
                .maxPatients(180)
                .active(true)
                .build());

        mockMvc.perform(delete("/api/v1/admin/whatsapp/instances/" + inst.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
