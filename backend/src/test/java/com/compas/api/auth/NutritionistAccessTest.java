package com.compas.api.auth;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NutritionistAccessTest {

    @BeforeEach
    @AfterEach
    void cleanUp() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void findCurrentNutritionistId_emptyWhenNonePresent() {
        assertTrue(NutritionistAccess.findCurrentNutritionistId().isEmpty());
    }

    @Test
    void getCurrentNutritionistId_throwsWhenNonePresent() {
        assertThrows(IllegalStateException.class, NutritionistAccess::getCurrentNutritionistId);
    }

    @Test
    void findCurrentNutritionistId_prefersTenantContext() {
        UUID tenantId = UUID.randomUUID();
        UUID securityId = UUID.randomUUID();

        TenantContext.setTenantId(tenantId);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(securityId, null, Collections.emptyList())
        );

        assertEquals(Optional.of(tenantId), NutritionistAccess.findCurrentNutritionistId());
        assertEquals(tenantId, NutritionistAccess.getCurrentNutritionistId());
    }

    @Test
    void findCurrentNutritionistId_fallsBackToSecurityContext() {
        UUID securityId = UUID.randomUUID();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(securityId, null, Collections.emptyList())
        );

        assertEquals(Optional.of(securityId), NutritionistAccess.findCurrentNutritionistId());
        assertEquals(securityId, NutritionistAccess.getCurrentNutritionistId());
    }
}
