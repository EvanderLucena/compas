package com.nutriai.api.auth;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;

/**
 * ThreadLocal context managing the current tenant (nutritionist) ID and RLS bypass flag.
 * Used by TenantAwareDataSource to configure PostgreSQL Row-Level Security session variables.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> BYPASS_RLS = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    public static void setTenantId(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Optional<UUID> getTenantId() {
        return Optional.ofNullable(CURRENT_TENANT.get());
    }

    public static void setBypassRls(boolean bypass) {
        BYPASS_RLS.set(bypass);
    }

    public static boolean isBypassRls() {
        return Boolean.TRUE.equals(BYPASS_RLS.get());
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        BYPASS_RLS.remove();
    }

    public static void executeAsTenant(UUID tenantId, Runnable action) {
        UUID previousTenant = CURRENT_TENANT.get();
        Boolean previousBypass = BYPASS_RLS.get();
        setTenantId(tenantId);
        setBypassRls(false);
        try {
            action.run();
        } finally {
            restoreState(previousTenant, previousBypass);
        }
    }

    public static <T> T callAsTenant(UUID tenantId, Callable<T> action) throws Exception {
        UUID previousTenant = CURRENT_TENANT.get();
        Boolean previousBypass = BYPASS_RLS.get();
        setTenantId(tenantId);
        setBypassRls(false);
        try {
            return action.call();
        } finally {
            restoreState(previousTenant, previousBypass);
        }
    }

    public static void executeWithBypass(Runnable action) {
        UUID previousTenant = CURRENT_TENANT.get();
        Boolean previousBypass = BYPASS_RLS.get();
        setBypassRls(true);
        try {
            action.run();
        } finally {
            restoreState(previousTenant, previousBypass);
        }
    }

    public static <T> T callWithBypass(Callable<T> action) throws Exception {
        UUID previousTenant = CURRENT_TENANT.get();
        Boolean previousBypass = BYPASS_RLS.get();
        setBypassRls(true);
        try {
            return action.call();
        } finally {
            restoreState(previousTenant, previousBypass);
        }
    }

    private static void restoreState(UUID previousTenant, Boolean previousBypass) {
        if (previousTenant != null) {
            CURRENT_TENANT.set(previousTenant);
        } else {
            CURRENT_TENANT.remove();
        }
        if (previousBypass != null) {
            BYPASS_RLS.set(previousBypass);
        } else {
            BYPASS_RLS.remove();
        }
    }
}
