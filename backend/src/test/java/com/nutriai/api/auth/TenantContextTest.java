package com.nutriai.api.auth;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantContextTest {

    @BeforeEach
    @AfterEach
    void cleanUp() {
        TenantContext.clear();
    }

    @Test
    void setAndGetTenantId() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        assertEquals(Optional.of(tenantId), TenantContext.getTenantId());
    }

    @Test
    void setAndGetBypassRls() {
        assertFalse(TenantContext.isBypassRls());

        TenantContext.setBypassRls(true);
        assertTrue(TenantContext.isBypassRls());

        TenantContext.setBypassRls(false);
        assertFalse(TenantContext.isBypassRls());
    }

    @Test
    void clearRemovesBothTenantAndBypass() {
        TenantContext.setTenantId(UUID.randomUUID());
        TenantContext.setBypassRls(true);

        TenantContext.clear();

        assertTrue(TenantContext.getTenantId().isEmpty());
        assertFalse(TenantContext.isBypassRls());
    }

    @Test
    void executeAsTenant_setsTenantAndRestoresPreviousState() {
        UUID outerTenant = UUID.randomUUID();
        UUID innerTenant = UUID.randomUUID();
        TenantContext.setTenantId(outerTenant);

        AtomicReference<UUID> seenInner = new AtomicReference<>();
        TenantContext.executeAsTenant(innerTenant, () -> {
            seenInner.set(TenantContext.getTenantId().orElse(null));
        });

        assertEquals(innerTenant, seenInner.get());
        assertEquals(Optional.of(outerTenant), TenantContext.getTenantId());
    }

    @Test
    void executeAsTenant_restoresOnException() {
        UUID outerTenant = UUID.randomUUID();
        UUID innerTenant = UUID.randomUUID();
        TenantContext.setTenantId(outerTenant);

        assertThrows(RuntimeException.class, () ->
                TenantContext.executeAsTenant(innerTenant, () -> {
                    throw new RuntimeException("fail");
                })
        );

        assertEquals(Optional.of(outerTenant), TenantContext.getTenantId());
    }

    @Test
    void callAsTenant_returnsValueAndRestoresState() throws Exception {
        UUID tenant = UUID.randomUUID();

        String result = TenantContext.callAsTenant(tenant, () -> {
            assertEquals(Optional.of(tenant), TenantContext.getTenantId());
            return "success";
        });

        assertEquals("success", result);
        assertTrue(TenantContext.getTenantId().isEmpty());
    }

    @Test
    void executeWithBypass_setsBypassAndRestores() {
        UUID tenant = UUID.randomUUID();
        TenantContext.setTenantId(tenant);
        TenantContext.setBypassRls(false);

        AtomicBoolean innerBypass = new AtomicBoolean(false);
        TenantContext.executeWithBypass(() -> {
            innerBypass.set(TenantContext.isBypassRls());
        });

        assertTrue(innerBypass.get());
        assertFalse(TenantContext.isBypassRls());
        assertEquals(Optional.of(tenant), TenantContext.getTenantId());
    }

    @Test
    void callWithBypass_returnsValueAndRestoresState() throws Exception {
        assertFalse(TenantContext.isBypassRls());

        int result = TenantContext.callWithBypass(() -> {
            assertTrue(TenantContext.isBypassRls());
            return 42;
        });

        assertEquals(42, result);
        assertFalse(TenantContext.isBypassRls());
    }

    @Test
    void setTenantId_clearsBypassRls() {
        TenantContext.setBypassRls(true);
        assertTrue(TenantContext.isBypassRls());

        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        assertEquals(Optional.of(tenantId), TenantContext.getTenantId());
        assertFalse(TenantContext.isBypassRls());
    }

    @Test
    void setBypassRls_true_clearsTenantId() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        assertEquals(Optional.of(tenantId), TenantContext.getTenantId());

        TenantContext.setBypassRls(true);
        assertTrue(TenantContext.isBypassRls());
        assertTrue(TenantContext.getTenantId().isEmpty());
    }
}
