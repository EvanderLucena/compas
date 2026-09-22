package com.compas.api.auth;

import com.compas.api.model.Nutritionist;
import com.compas.api.model.UserRole;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private Nutritionist testNutritionist;

    @BeforeEach
    void setUp() {
        String secret = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256-algorithm-minimum";
        long accessTokenExpiration = 900000; // 15 min
        long refreshTokenExpiration = 604800000; // 7 days
        jwtService = new JwtService(secret, accessTokenExpiration, refreshTokenExpiration);

        testNutritionist = Nutritionist.builder()
                .id(UUID.randomUUID())
                .email("test@nutriai.com")
                .name("Dr. Test")
                .passwordHash("hashedpassword")
                .role(UserRole.NUTRITIONIST)
                .onboardingCompleted(false)
                .subscriptionTier("TRIAL")
                .patientLimit(15)
                .build();
    }

    @Test
    void generateAccessToken_producesValidJwtWithCorrectClaims() {
        String token = jwtService.generateAccessToken(testNutritionist);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        var claims = jwtService.validateToken(token);
        assertEquals(testNutritionist.getId().toString(), claims.getPayload().getSubject());
        assertEquals(testNutritionist.getEmail(), claims.getPayload().get("email", String.class));
        assertEquals("NUTRITIONIST", claims.getPayload().get("role", String.class));
    }

    @Test
    void generateRefreshToken_producesValidJwtWithJtiClaim() {
        String token = jwtService.generateRefreshToken(testNutritionist);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        var claims = jwtService.validateToken(token);
        assertEquals(testNutritionist.getId().toString(), claims.getPayload().getSubject());
        assertNotNull(claims.getPayload().get("jti", String.class));
        // jti should be a valid UUID
        assertDoesNotThrow(() -> UUID.fromString(claims.getPayload().get("jti", String.class)));
    }

    @Test
    void validateToken_throwsOnExpiredToken() {
        // Create JwtService with very short expiration (1ms)
        String secret = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256-algorithm-minimum";
        JwtService shortLivedService = new JwtService(secret, 1, 1);

        String token = shortLivedService.generateAccessToken(testNutritionist);

        // Wait for token to expire
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertThrows(JwtException.class, () -> shortLivedService.validateToken(token));
    }

    @Test
    void validateToken_throwsOnInvalidSignature() {
        String token = jwtService.generateAccessToken(testNutritionist);

        // Create service with different secret
        String differentSecret = "different-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256-algorithm-testing";
        JwtService differentKeyService = new JwtService(differentSecret, 900000, 604800000);

        assertThrows(JwtException.class, () -> differentKeyService.validateToken(token));
    }

    @Test
    void extractNutritionistId_returnsCorrectUuid() {
        String token = jwtService.generateAccessToken(testNutritionist);
        UUID extracted = jwtService.extractNutritionistId(token);
        assertEquals(testNutritionist.getId(), extracted);
    }

    @Test
    void extractJti_returnsCorrectJtiValue() {
        String token = jwtService.generateRefreshToken(testNutritionist);
        String jti = jwtService.extractJti(token);
        assertNotNull(jti);
        // jti should be a valid UUID format
        assertDoesNotThrow(() -> UUID.fromString(jti));
    }
}