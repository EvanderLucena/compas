package com.compas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.auth.JwtService;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.model.PatientStatus;
import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppMessageRepository;
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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ClinicalRadarControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private NutritionistRepository nutritionistRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private WhatsAppMessageRepository whatsAppMessageRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String accessToken;
    private UUID nutritionistId;
    private UUID patientId;
    private UUID messageId;

    @BeforeEach
    void setUp() {
        whatsAppMessageRepository.deleteAll();
        patientRepository.deleteAll();
        nutritionistRepository.deleteAll();

        Nutritionist nutri = Nutritionist.builder()
                .name("Dra. Beatriz")
                .email("beatriz.radar." + UUID.randomUUID() + "@nutriai.com")
                .passwordHash(passwordEncoder.encode("Senha123!"))
                .crn("CRN-3/99999")
                .build();
        nutritionistRepository.save(nutri);
        nutritionistId = nutri.getId();
        accessToken = jwtService.generateAccessToken(nutri);

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Lucas Silva")
                .whatsapp("11988887777")
                .objective(PatientObjective.HIPERTROFIA)
                .status(PatientStatus.ONTRACK)
                .active(true)
                .build();
        patientRepository.save(patient);
        patientId = patient.getId();

        WhatsAppMessage msg = WhatsAppMessage.builder()
                .messageId("msg-" + UUID.randomUUID())
                .instanceId("default")
                .senderPhone("5511988887777")
                .senderPhoneNormalized("5511988887777")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageType("text")
                .messageContent("Comi um pote de sorvete ontem à noite")
                .jevIntent("emotional_slip")
                .jevIntentConfidence(new BigDecimal("0.920"))
                .jevSentiment("guilty_or_struggling")
                .jevSentimentConfidence(new BigDecimal("0.880"))
                .jevAttentionScore(new BigDecimal("0.850"))
                .jevRequiresAttention(true)
                .jevAttentionResolved(false)
                .processed(true)
                .build();
        whatsAppMessageRepository.save(msg);
        messageId = msg.getId();
    }

    @Test
    void getClinicalRadar_authenticated_returnsRadarData() throws Exception {
        mockMvc.perform(get("/api/v1/clinical-radar")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.summary.totalPatients").value(1))
                .andExpect(jsonPath("$.data.summary.requiringAttentionCount").value(1))
                .andExpect(jsonPath("$.data.attentionQueue[0].patientName").value("Lucas Silva"))
                .andExpect(jsonPath("$.data.attentionQueue[0].sentiment").value("guilty_or_struggling"))
                .andExpect(jsonPath("$.data.sentimentDistribution.struggling").value(1));
    }

    @Test
    void resolveAttention_authenticated_marksResolved() throws Exception {
        mockMvc.perform(post("/api/v1/clinical-radar/attention/" + messageId + "/resolve")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.resolved").value(true));

        WhatsAppMessage updated = whatsAppMessageRepository.findById(messageId).orElseThrow();
        assertTrue(updated.getJevAttentionResolved());
    }

    @Test
    void getClinicalRadar_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/clinical-radar")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
