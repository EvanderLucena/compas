package com.compas.api.service;

import com.compas.api.dto.intelligence.ClinicalRadarDTO;
import com.compas.api.model.Patient;
import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.MealExtractionRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClinicalRadarServiceTest {

    @Mock
    private WhatsAppMessageRepository whatsAppMessageRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private MealExtractionRepository mealExtractionRepository;

    private ClinicalRadarService clinicalRadarService;
    private UUID nutritionistId;
    private UUID patientId;
    private UUID messageId;

    @BeforeEach
    void setUp() {
        clinicalRadarService = new ClinicalRadarService(
                whatsAppMessageRepository,
                patientRepository,
                mealExtractionRepository
        );
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        messageId = UUID.randomUUID();
    }

    @Test
    void getClinicalRadar_returnsCompiledMetricsAndQueue() {
        when(patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId)).thenReturn(10L);

        WhatsAppMessage msg = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("msg-123")
                .instanceId("inst-1")
                .senderPhone("5511999999999")
                .senderPhoneNormalized("5511999999999")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageContent("Comi um lanche e me sinto péssimo")
                .jevIntent("meal_log")
                .jevIntentConfidence(new BigDecimal("0.950"))
                .jevSentiment("guilty_or_struggling")
                .jevSentimentConfidence(new BigDecimal("0.890"))
                .jevAttentionScore(new BigDecimal("0.820"))
                .jevRequiresAttention(true)
                .jevAttentionResolved(false)
                .build();

        when(whatsAppMessageRepository.findUnresolvedAttentionMessages(nutritionistId))
                .thenReturn(List.of(msg));

        Patient patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Carlos Alberto")
                .whatsapp("11999999999")
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(patient));

        List<Object[]> sentimentRows = List.of(
                new Object[]{"positive_or_motivated", 5L},
                new Object[]{"neutral", 3L},
                new Object[]{"guilty_or_struggling", 2L},
                new Object[]{"anxious_or_doubting", 1L}
        );
        when(whatsAppMessageRepository.countSentimentDistribution(eq(nutritionistId), any(LocalDateTime.class)))
                .thenReturn(sentimentRows);

        when(mealExtractionRepository.countByNutritionistIdAndExtractedAtBetween(
                eq(nutritionistId), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(7L);

        when(whatsAppMessageRepository.existsByNutritionistIdAndCreatedAtAfter(
                eq(nutritionistId), any(LocalDateTime.class))).thenReturn(true);

        ClinicalRadarDTO result = clinicalRadarService.getClinicalRadar(nutritionistId);

        assertNotNull(result);
        assertEquals(10L, result.summary().totalPatients());
        assertEquals(1, result.summary().requiringAttentionCount());
        assertEquals(2L, result.summary().strugglingCount());
        assertEquals(7L, result.summary().todayExtractionsCount());
        assertTrue(result.summary().whatsappConnected());

        assertEquals(1, result.attentionQueue().size());
        var item = result.attentionQueue().get(0);
        assertEquals(patientId, item.patientId());
        assertEquals("Carlos Alberto", item.patientName());
        assertEquals("guilty_or_struggling", item.sentiment());
        assertEquals(new BigDecimal("0.820"), item.attentionScore());

        assertEquals(5L, result.sentimentDistribution().motivated());
        assertEquals(3L, result.sentimentDistribution().neutral());
        assertEquals(2L, result.sentimentDistribution().struggling());
        assertEquals(1L, result.sentimentDistribution().anxious());
    }

    @Test
    void resolveAttentionItem_success_marksResolvedAndSaves() {
        WhatsAppMessage msg = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("msg-abc")
                .instanceId("inst-1")
                .senderPhone("5511999999999")
                .senderPhoneNormalized("5511999999999")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .jevRequiresAttention(true)
                .jevAttentionResolved(false)
                .build();

        when(whatsAppMessageRepository.findByIdAndNutritionistId(messageId, nutritionistId))
                .thenReturn(Optional.of(msg));

        clinicalRadarService.resolveAttentionItem(messageId, nutritionistId);

        assertTrue(msg.getJevAttentionResolved());
        verify(whatsAppMessageRepository).save(msg);
    }

    @Test
    void resolveAttentionItem_notFound_throws404() {
        when(whatsAppMessageRepository.findByIdAndNutritionistId(messageId, nutritionistId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                clinicalRadarService.resolveAttentionItem(messageId, nutritionistId));
    }
}
