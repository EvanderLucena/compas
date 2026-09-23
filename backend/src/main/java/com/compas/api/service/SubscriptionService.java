package com.compas.api.service;

import com.compas.api.exception.SubscriptionRequiredException;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service that encapsulates subscription status verification and enforces
 * write-blocking (read-only mode) for expired or canceled accounts.
 */
@Service
public class SubscriptionService {

    private final NutritionistRepository nutritionistRepository;

    public SubscriptionService(NutritionistRepository nutritionistRepository) {
        this.nutritionistRepository = nutritionistRepository;
    }

    /**
     * Checks if the nutritionist has an active paid or trial subscription.
     */
    @Transactional(readOnly = true)
    public boolean isSubscriptionActive(UUID nutritionistId) {
        if (nutritionistId == null) {
            return false;
        }
        return nutritionistRepository.findById(nutritionistId)
                .map(Nutritionist::isSubscriptionActive)
                .orElse(false);
    }

    /**
     * Enforces that the nutritionist has an active subscription.
     * Throws SubscriptionRequiredException (HTTP 402 READ_ONLY_MODE) if expired or inactive.
     */
    @Transactional(readOnly = true)
    public void assertSubscriptionActive(UUID nutritionistId) {
        if (!isSubscriptionActive(nutritionistId)) {
            throw new SubscriptionRequiredException(
                    "Modo Leitura ativo: seu período de testes expirou ou sua assinatura está inativa. "
                            + "Reative seu plano para criar, editar ou excluir registros."
            );
        }
    }
}
