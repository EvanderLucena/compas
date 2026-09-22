package com.compas.api.auth;

import com.compas.api.auth.dto.LoginRequest;
import com.compas.api.auth.dto.SignupRequest;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // Clean up before each test
        refreshTokenRepository.deleteAll();
        nutritionistRepository.deleteAll();
    }

    @Test
    void signup_createsNutritionistWithHashedPassword() {
        SignupRequest request = new SignupRequest(
                "Dr. Test",
                "test@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                "Nutrição Esportiva",
                "11999999999",
                true
        );

        AuthService.SignupResult result = authService.signup(request);

        assertNotNull(result.accessToken());
        assertNotNull(result.refreshToken());
        assertEquals("Dr. Test", result.user().name());
        assertEquals("test@nutriai.com", result.user().email());
        assertEquals("NUTRITIONIST", result.user().role());
        assertFalse(result.user().onboardingCompleted());

        // Verify password is hashed
        Nutritionist saved = nutritionistRepository.findByEmail("test@nutriai.com").orElseThrow();
        assertNotEquals("senha12345", saved.getPasswordHash());
        assertTrue(passwordEncoder.matches("senha12345", saved.getPasswordHash()));

        // Verify trial defaults
        assertNotNull(saved.getTrialEndsAt());
        assertEquals("TRIAL", saved.getSubscriptionTier());
        assertEquals(15, saved.getPatientLimit());
        assertFalse(saved.getOnboardingCompleted());
    }

    @Test
    void signup_throws409OnDuplicateEmail() {
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

        authService.signup(request);

        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.signup(request)
        );
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void login_returnsTokensWithValidCredentials() {
        // Create a user first
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "login@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        authService.signup(signupRequest);

        LoginRequest loginRequest = new LoginRequest("login@nutriai.com", "senha12345");
        AuthService.LoginResult result = authService.login(loginRequest);

        assertNotNull(result.accessToken());
        assertNotNull(result.refreshToken());
        assertEquals("Dr. Test", result.user().name());
    }

    @Test
    void login_throws401WithWrongPassword() {
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "wrong-pass@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        authService.signup(signupRequest);

        LoginRequest loginRequest = new LoginRequest("wrong-pass@nutriai.com", "wrongpassword");
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.login(loginRequest)
        );
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void login_throws401WithNonExistentEmail() {
        LoginRequest loginRequest = new LoginRequest("nonexistent@nutriai.com", "anypassword");
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.login(loginRequest)
        );
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void refresh_rotatesRefreshToken() {
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "refresh@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        AuthService.SignupResult signupResult = authService.signup(signupRequest);

        // Refresh with the initial refresh token
        AuthService.RefreshResult refreshResult = authService.refresh(signupResult.refreshToken());

        assertNotNull(refreshResult.accessToken());
        assertNotNull(refreshResult.refreshToken());

        // Old refresh token should be invalidated — using it again should throw 401
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.refresh(signupResult.refreshToken())
        );
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void logout_deletesAllRefreshTokens() {
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "logout@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        AuthService.SignupResult signupResult = authService.signup(signupRequest);

        UUID nutritionistId = signupResult.user().id();
        assertFalse(refreshTokenRepository.findAll().isEmpty());

        authService.logout(nutritionistId);

        // After logout, the refresh token that was stored should be gone
        // Verify by trying to refresh with the original token — should fail
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.refresh(signupResult.refreshToken())
        );
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void completeOnboarding_setsOnboardingCompleted() {
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "onboard@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                null,
                null,
                true
        );
        AuthService.SignupResult signupResult = authService.signup(signupRequest);

        UUID nutritionistId = signupResult.user().id();
        authService.completeOnboarding(nutritionistId);

        Nutritionist updated = nutritionistRepository.findById(nutritionistId).orElseThrow();
        assertTrue(updated.getOnboardingCompleted());
    }

    @Test
    void getCurrentUser_returnsMeResponse() {
        SignupRequest signupRequest = new SignupRequest(
                "Dr. Test",
                "me@nutriai.com",
                "senha12345",
                "12345",
                "SP",
                "Nutrição Esportiva",
                "11999999999",
                true
        );
        AuthService.SignupResult signupResult = authService.signup(signupRequest);

        var meResponse = authService.getCurrentUser(signupResult.user().id());

        assertEquals("Dr. Test", meResponse.name());
        assertEquals("me@nutriai.com", meResponse.email());
        assertEquals("12345", meResponse.crn());
        assertEquals("SP", meResponse.crnRegional());
        assertEquals("Nutrição Esportiva", meResponse.specialty());
        assertEquals("11999999999", meResponse.whatsapp());
        assertFalse(meResponse.onboardingCompleted());
        assertEquals("TRIAL", meResponse.subscriptionTier());
        assertEquals(15, meResponse.patientLimit());
    }
}