package com.compas.api.auth;

import com.compas.api.auth.dto.LoginRequest;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();
    }

    @Test
    void signup_withValidData_returns200WithTokens() throws Exception {
        SignupRequest request = new SignupRequest(
                "Dr. Test",
                "test@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Dr. Test"))
                .andExpect(jsonPath("$.user.email").value("test@nutriai.com"))
                .andExpect(jsonPath("$.user.role").value("NUTRITIONIST"))
                .andExpect(jsonPath("$.user.onboardingCompleted").value(false))
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    void signup_withDuplicateEmail_returns409() throws Exception {
        SignupRequest request = new SignupRequest(
                "Dr. Test",
                "duplicate@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        // First signup succeeds
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Second signup with same email returns 409
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void signup_withInvalidEmail_returns400() throws Exception {
        SignupRequest request = new SignupRequest(
                "Dr. Test",
                "not-an-email",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signup_withShortPassword_returns400() throws Exception {
        SignupRequest request = new SignupRequest(
                "Dr. Test",
                "short@nutriai.com",
                "1234567",  // 7 chars, min is 8
                "12345",
                "SP",
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_withValidCredentials_returns200WithTokens() throws Exception {
        // Create user via signup first
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Login",
                "login@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk());

        // Login
        LoginRequest loginRequest = new LoginRequest("login@nutriai.com", "senha12345");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Dr. Login"))
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        // Create user via signup
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Wrong",
                "wrong-pass@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk());

        // Login with wrong password
        LoginRequest loginRequest = new LoginRequest("wrong-pass@nutriai.com", "wrongpassword");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withNonExistentEmail_returns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest("noone@nutriai.com", "anypassword");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_withValidToken_returns200WithUserInfo() throws Exception {
        // Signup and extract token
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Me",
                "me@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                "Esportiva",
                "11988887777",
                true
        );

        String response = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(response).get("accessToken").asText();

        // GET /me with valid token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dr. Me"))
                .andExpect(jsonPath("$.email").value("me@nutriai.com"))
                .andExpect(jsonPath("$.crn").value("12345"))
                .andExpect(jsonPath("$.crnRegional").value("SP"))
                .andExpect(jsonPath("$.subscriptionTier").value("TRIAL"))
                .andExpect(jsonPath("$.patientLimit").value(15));
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onboarding_withValidToken_marksCompleted() throws Exception {
        // Signup and extract token
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Onboard",
                "onboard@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        String response = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(response).get("accessToken").asText();

        // Complete onboarding
        mockMvc.perform(post("/api/v1/auth/onboarding")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"step\":1,\"completed\":true}"))
                .andExpect(status().isOk());

        // Verify onboarding completed
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    void logout_withValidToken_clearsCookie() throws Exception {
        // Signup and extract token
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Logout",
                "logout-ctrl@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        String response = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(response).get("accessToken").asText();

        // Logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void healthEndpoint_doesNotRequireAuth() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }

    @Test
    void verifyEmail_withValidToken_returns200() throws Exception {
        SignupRequest signupRequest = new SignupRequest(
                "Dra. Controller",
                "ctrl-verif@compas.app",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk());

        Nutritionist created = nutritionistRepository.findByEmail("ctrl-verif@compas.app").orElseThrow();
        String token = created.getEmailVerificationToken();

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void verifyEmail_withBlankToken_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerification_withEmail_returns200() throws Exception {
        SignupRequest signupRequest = new SignupRequest(
                "Dra. ResendCtrl",
                "ctrl-resend@compas.app",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk());

        Nutritionist created = nutritionistRepository.findByEmail("ctrl-resend@compas.app").orElseThrow();
        created.setEmailVerificationExpiresAt(java.time.LocalDateTime.now().plusHours(22));
        nutritionistRepository.save(created);

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ctrl-resend@compas.app\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}