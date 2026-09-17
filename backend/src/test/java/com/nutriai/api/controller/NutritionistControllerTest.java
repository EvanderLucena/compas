package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.auth.AuthService;
import com.nutriai.api.auth.RefreshTokenRepository;
import com.nutriai.api.auth.dto.LoginRequest;
import com.nutriai.api.auth.dto.SignupRequest;
import com.nutriai.api.dto.nutritionist.ChangePasswordRequest;
import com.nutriai.api.dto.nutritionist.UpdateProfileRequest;
import com.nutriai.api.repository.NutritionistRepository;
import com.nutriai.api.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NutritionistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    private String accessToken;

    @BeforeEach
    void setUp() {
        patientRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();

        SignupRequest signupReq = new SignupRequest(
                "Dra. Camila Santos",
                "camila@nutri.com",
                "senhaForte123!",
                "98765",
                "CRN-3",
                "Nutrição Clínica",
                "11988887777",
                true
        );
        var result = authService.signup(signupReq);
        accessToken = result.accessToken();
    }

    @Test
    void getProfile_authenticated_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/nutritionist/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Dra. Camila Santos"))
                .andExpect(jsonPath("$.data.email").value("camila@nutri.com"))
                .andExpect(jsonPath("$.data.crn").value("98765"))
                .andExpect(jsonPath("$.data.crnRegional").value("CRN-3"))
                .andExpect(jsonPath("$.data.subscriptionTier").value("TRIAL"))
                .andExpect(jsonPath("$.data.patientLimit").value(15))
                .andExpect(jsonPath("$.data.activePatientCount").value(0));
    }

    @Test
    void getProfile_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/nutritionist/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_success_returns200() throws Exception {
        UpdateProfileRequest updateReq = new UpdateProfileRequest(
                "Dra. Camila S. Oliveira",
                "98765-P",
                "CRN-4",
                "Comportamental & Esportiva",
                "21977776666"
        );

        mockMvc.perform(put("/api/v1/nutritionist/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Dra. Camila S. Oliveira"))
                .andExpect(jsonPath("$.data.crn").value("98765-P"))
                .andExpect(jsonPath("$.data.crnRegional").value("CRN-4"))
                .andExpect(jsonPath("$.data.specialty").value("Comportamental & Esportiva"))
                .andExpect(jsonPath("$.data.whatsapp").value("21977776666"));
    }

    @Test
    void updateProfile_blankName_returns400() throws Exception {
        UpdateProfileRequest updateReq = new UpdateProfileRequest(
                "   ",
                "98765",
                "CRN-3",
                "Clínica",
                "11988887777"
        );

        mockMvc.perform(put("/api/v1/nutritionist/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void changePassword_success_allowsNewLogin() throws Exception {
        ChangePasswordRequest changeReq = new ChangePasswordRequest(
                "senhaForte123!",
                "novaSenhaSegura456!",
                "novaSenhaSegura456!"
        );

        mockMvc.perform(post("/api/v1/nutritionist/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("Senha alterada com sucesso"));

        // Verify login with new password works
        LoginRequest loginReq = new LoginRequest("camila@nutri.com", "novaSenhaSegura456!");
        var loginResult = authService.login(loginReq);
        org.junit.jupiter.api.Assertions.assertNotNull(loginResult.accessToken());
    }

    @Test
    void changePassword_wrongCurrentPassword_returns400() throws Exception {
        ChangePasswordRequest changeReq = new ChangePasswordRequest(
                "senhaIncorreta!",
                "novaSenhaSegura456!",
                "novaSenhaSegura456!"
        );

        mockMvc.perform(post("/api/v1/nutritionist/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("A senha atual está incorreta"));
    }

    @Test
    void changePassword_shortNewPassword_returns400() throws Exception {
        ChangePasswordRequest changeReq = new ChangePasswordRequest(
                "senhaForte123!",
                "curto",
                "curto"
        );

        mockMvc.perform(post("/api/v1/nutritionist/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void changePassword_mismatchedConfirmation_returns400() throws Exception {
        ChangePasswordRequest changeReq = new ChangePasswordRequest(
                "senhaForte123!",
                "novaSenhaSegura456!",
                "diferenteSenha789!"
        );

        mockMvc.perform(post("/api/v1/nutritionist/change-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("A nova senha e a confirmação não conferem"));
    }
}
