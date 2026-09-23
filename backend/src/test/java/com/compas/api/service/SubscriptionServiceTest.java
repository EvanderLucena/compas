package com.compas.api.service;

import com.compas.api.exception.SubscriptionRequiredException;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private NutritionistRepository nutritionistRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
    }

    @Test
    @DisplayName("isSubscriptionActive returns true for paid tiers (UNLIMITED, PRO, STARTER)")
    void isSubscriptionActive_paidTiers_returnsTrue() {
        for (String tier : new String[]{"UNLIMITED", "PRO", "STARTER", "pro", "unlimited"}) {
            Nutritionist nutri = Nutritionist.builder()
                    .id(nutritionistId)
                    .subscriptionTier(tier)
                    .build();
            when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

            assertTrue(subscriptionService.isSubscriptionActive(nutritionistId),
                    "Expected active for tier " + tier);
        }
    }

    @Test
    @DisplayName("isSubscriptionActive returns true for TRIAL with future expiration date")
    void isSubscriptionActive_trialFuture_returnsTrue() {
        Nutritionist nutri = Nutritionist.builder()
                .id(nutritionistId)
                .subscriptionTier("TRIAL")
                .trialEndsAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(10))
                .build();
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

        assertTrue(subscriptionService.isSubscriptionActive(nutritionistId));
    }

    @Test
    @DisplayName("isSubscriptionActive returns false for TRIAL when trialEndsAt is null (fail-closed)")
    void isSubscriptionActive_trialNull_returnsFalse() {
        Nutritionist nutri = Nutritionist.builder()
                .id(nutritionistId)
                .subscriptionTier("TRIAL")
                .trialEndsAt(null)
                .build();
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

        assertFalse(subscriptionService.isSubscriptionActive(nutritionistId));
    }

    @Test
    @DisplayName("isSubscriptionActive returns false for TRIAL with past expiration date")
    void isSubscriptionActive_trialExpired_returnsFalse() {
        Nutritionist nutri = Nutritionist.builder()
                .id(nutritionistId)
                .subscriptionTier("TRIAL")
                .trialEndsAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1))
                .build();
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

        assertFalse(subscriptionService.isSubscriptionActive(nutritionistId));
    }

    @Test
    @DisplayName("isSubscriptionActive returns false for canceled, expired or null tiers")
    void isSubscriptionActive_inactiveTiers_returnsFalse() {
        for (String tier : new String[]{"CANCELED", "EXPIRED", "INACTIVE", null}) {
            Nutritionist nutri = Nutritionist.builder()
                    .id(nutritionistId)
                    .subscriptionTier(tier)
                    .build();
            when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

            assertFalse(subscriptionService.isSubscriptionActive(nutritionistId));
        }
    }

    @Test
    @DisplayName("assertSubscriptionActive throws SubscriptionRequiredException when subscription is inactive")
    void assertSubscriptionActive_inactive_throwsSubscriptionRequiredException() {
        Nutritionist nutri = Nutritionist.builder()
                .id(nutritionistId)
                .subscriptionTier("TRIAL")
                .trialEndsAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5))
                .build();
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

        SubscriptionRequiredException ex = assertThrows(
                SubscriptionRequiredException.class,
                () -> subscriptionService.assertSubscriptionActive(nutritionistId)
        );
        assertTrue(ex.getMessage().contains("Modo Leitura ativo"));
    }

    @Test
    @DisplayName("assertSubscriptionActive succeeds when subscription is active")
    void assertSubscriptionActive_active_doesNotThrow() {
        Nutritionist nutri = Nutritionist.builder()
                .id(nutritionistId)
                .subscriptionTier("PRO")
                .build();
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutri));

        assertDoesNotThrow(() -> subscriptionService.assertSubscriptionActive(nutritionistId));
    }

    @Test
    @DisplayName("Nutritionist.isSubscriptionActive static helper handles null tier and expired trial consistently")
    void nutritionist_isSubscriptionActive_staticHelper() {
        assertFalse(Nutritionist.isSubscriptionActive(null, null));
        assertFalse(Nutritionist.isSubscriptionActive(null, LocalDateTime.now(ZoneOffset.UTC).plusDays(5)));
        assertTrue(Nutritionist.isSubscriptionActive("PRO", null));
        assertFalse(Nutritionist.isSubscriptionActive("TRIAL", null));
        assertTrue(Nutritionist.isSubscriptionActive("TRIAL", LocalDateTime.now(ZoneOffset.UTC).plusDays(1)));
        assertFalse(Nutritionist.isSubscriptionActive("TRIAL", LocalDateTime.now(ZoneOffset.UTC).minusDays(1)));
    }
}
