package com.nutriai.api.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Utility class to extract the authenticated nutritionist ID from the SecurityContext or TenantContext.
 */
public final class NutritionistAccess {

    private NutritionistAccess() {
        // Utility class
    }

    /**
     * Get the current authenticated nutritionist's UUID from the SecurityContext or TenantContext.
     *
     * @return the nutritionist UUID
     * @throws IllegalStateException if no authenticated user is found
     */
    public static UUID getCurrentNutritionistId() {
        return findCurrentNutritionistId()
                .orElseThrow(() -> new IllegalStateException("No authenticated user found"));
    }

    /**
     * Look up the current authenticated nutritionist's UUID, if present.
     *
     * @return optional containing the nutritionist UUID, or empty
     */
    public static Optional<UUID> findCurrentNutritionistId() {
        Optional<UUID> tenantOpt = TenantContext.getTenantId();
        if (tenantOpt.isPresent()) {
            return tenantOpt;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UUID uuid) {
            return Optional.of(uuid);
        }
        return Optional.empty();
    }
}