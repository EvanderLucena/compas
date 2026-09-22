package com.compas.api.service;

import com.compas.api.dto.llm.ExtractionItemResult;
import com.compas.api.dto.llm.ExtractionResult;
import com.compas.api.model.EpisodeHistoryEvent;
import com.compas.api.model.ExtractionItem;
import com.compas.api.model.MealExtraction;
import com.compas.api.repository.EpisodeHistoryEventRepository;
import com.compas.api.repository.ExtractionItemRepository;
import com.compas.api.repository.MealExtractionRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExtractionServiceTest {

    @Mock MealExtractionRepository mealExtractionRepository;
    @Mock ExtractionItemRepository extractionItemRepository;
    @Mock EpisodeHistoryEventRepository episodeHistoryEventRepository;
    @Mock JevService jevService;

    @InjectMocks
    ExtractionService extractionService;

    private UUID messageId;
    private UUID patientId;
    private UUID nutritionistId;
    private UUID episodeId;

    @BeforeEach
    void setup() {
        messageId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        nutritionistId = UUID.randomUUID();
        episodeId = UUID.randomUUID();
    }

    @Test
    void extractAndSave_validExtraction_persistsMealExtractionAndItems() {
        ExtractionResult extractionResult = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("arroz integral", 150.0, 170, 3.2, 35, 1.5),
                        new ExtractionItemResult("frango grelhado", 120.0, 198, 25, 0, 10.5)
                ),
                "Comi arroz e frango no almoço"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Comi arroz e frango no almoço")
                .mealLabel("almoço")
                .totalKcal(new BigDecimal("368.0"))
                .totalProt(new BigDecimal("28.2"))
                .totalCarb(new BigDecimal("35.0"))
                .totalFat(new BigDecimal("12.0"))
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(extractionItemRepository.save(any(ExtractionItem.class))).thenAnswer(i -> i.getArgument(0));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, extractionResult);

        assertNotNull(result);
        assertEquals("almoço", result.getMealLabel());

        // Verify MealExtraction was saved with correct totals
        ArgumentCaptor<MealExtraction> extractionCaptor = ArgumentCaptor.forClass(MealExtraction.class);
        verify(mealExtractionRepository).save(extractionCaptor.capture());
        MealExtraction captured = extractionCaptor.getValue();
        assertEquals(messageId, captured.getMessageId());
        assertEquals(patientId, captured.getPatientId());
        assertEquals(nutritionistId, captured.getNutritionistId());
        assertEquals(episodeId, captured.getEpisodeId());
        assertEquals("Comi arroz e frango no almoço", captured.getExtractionRaw());
        assertEquals(0, captured.getTotalKcal().compareTo(new BigDecimal("368")));
        assertEquals(0, captured.getTotalProt().compareTo(new BigDecimal("28.2")));

        // Verify ExtractionItems were saved
        verify(extractionItemRepository, times(2)).save(any(ExtractionItem.class));
    }

    @Test
    void extractAndSave_emitsEpisodeHistoryEvent() {
        ExtractionResult extractionResult = new ExtractionResult(
                "jantar",
                List.of(
                        new ExtractionItemResult("sopa de legumes", 250.0, 120, 5, 18, 3),
                        new ExtractionItemResult("pão integral", 30.0, 70, 2.5, 13, 1)
                ),
                "Jantei sopa e pão"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Jantei sopa e pão")
                .mealLabel("jantar")
                .totalKcal(new BigDecimal("190"))
                .totalProt(new BigDecimal("7.5"))
                .totalCarb(new BigDecimal("31"))
                .totalFat(new BigDecimal("4"))
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(extractionItemRepository.save(any(ExtractionItem.class))).thenAnswer(i -> i.getArgument(0));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        extractionService.extractAndSave(messageId, patientId, nutritionistId, episodeId, extractionResult);

        // Verify EpisodeHistoryEvent was emitted
        ArgumentCaptor<EpisodeHistoryEvent> eventCaptor = ArgumentCaptor.forClass(EpisodeHistoryEvent.class);
        verify(episodeHistoryEventRepository).save(eventCaptor.capture());
        EpisodeHistoryEvent event = eventCaptor.getValue();

        assertEquals("MEAL_EXTRACTION", event.getEventType());
        assertEquals(episodeId, event.getEpisodeId());
        assertEquals(nutritionistId, event.getNutritionistId());
        assertNotNull(event.getSourceRef());
        assertEquals(savedExtraction.getId().toString(), event.getSourceRef());
        assertNotNull(event.getTitle());
        assertTrue(event.getTitle().contains("Jantar"));
        assertTrue(event.getTitle().contains("WhatsApp"));
        assertTrue(event.getDescription().contains("2 itens"));
        assertTrue(event.getDescription().contains("sopa de legumes"));
        assertNotNull(event.getMetadataJson());
        assertTrue(event.getMetadataJson().contains("jantar"));
    }

    @Test
    void extractAndSave_emptyItems_stillPersistsExtractionAndEvent() {
        ExtractionResult extractionResult = new ExtractionResult(
                "lanche",
                List.of(),
                "Tomei um café"
        );

        MealExtraction savedExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("Tomei um café")
                .mealLabel("lanche")
                .totalKcal(BigDecimal.ZERO)
                .totalProt(BigDecimal.ZERO)
                .totalCarb(BigDecimal.ZERO)
                .totalFat(BigDecimal.ZERO)
                .build();

        when(mealExtractionRepository.save(any(MealExtraction.class))).thenReturn(savedExtraction);
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, extractionResult);

        assertNotNull(result);
        assertEquals(0, result.getTotalKcal().intValue());

        // No items to save
        verify(extractionItemRepository, never()).save(any());

        // Event still emitted
        verify(episodeHistoryEventRepository).save(any(EpisodeHistoryEvent.class));
    }

    @Test
    void extractAndSave_recentExtractionWithSameMealLabel_consolidatesInsteadOfDuplicating() {
        UUID existingExtractionId = UUID.randomUUID();
        MealExtraction existingExtraction = MealExtraction.builder()
                .id(existingExtractionId)
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("jantei um xtudo")
                .mealLabel("jantar")
                .totalKcal(new BigDecimal("650"))
                .totalProt(new BigDecimal("30"))
                .totalCarb(new BigDecimal("50"))
                .totalFat(new BigDecimal("35"))
                .extractedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(mealExtractionRepository.findFirstByPatientIdAndNutritionistIdAndExtractedAtAfterOrderByExtractedAtDesc(
                eq(patientId), eq(nutritionistId), any(LocalDateTime.class)))
                .thenReturn(Optional.of(existingExtraction));

        when(mealExtractionRepository.save(existingExtraction)).thenReturn(existingExtraction);

        EpisodeHistoryEvent existingEvent = EpisodeHistoryEvent.builder()
                .id(UUID.randomUUID())
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType("MEAL_EXTRACTION")
                .sourceRef(existingExtractionId.toString())
                .title("Jantar extraído via WhatsApp")
                .description("1 itens: xtudo")
                .build();
        when(episodeHistoryEventRepository.findBySourceRefAndNutritionistId(
                eq(existingExtractionId.toString()), eq(nutritionistId)))
                .thenReturn(Optional.of(existingEvent));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        ExtractionResult enrichedResult = new ExtractionResult(
                "jantar",
                List.of(
                        new ExtractionItemResult("hambúrguer artesanal", 150.0, 320, 24, 0, 24),
                        new ExtractionItemResult("pão brioche", 70.0, 200, 5, 38, 3),
                        new ExtractionItemResult("queijo prato", 30.0, 110, 7, 0.5, 9)
                ),
                "Foto do x-tudo"
        );

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, enrichedResult);

        assertNotNull(result);
        assertEquals(existingExtractionId, result.getId());
        assertEquals("jantar", result.getMealLabel());
        assertEquals(0, result.getTotalKcal().compareTo(new BigDecimal("630")));

        // Old items must be deleted and replaced
        verify(extractionItemRepository).deleteAllByExtractionId(existingExtractionId);
        verify(extractionItemRepository, times(3)).save(any(ExtractionItem.class));

        // Existing event must be updated with new description and totals
        verify(episodeHistoryEventRepository).save(existingEvent);
        assertTrue(existingEvent.getDescription().contains("3 itens"));
    }

    @Test
    void extractAndSave_recentExtractionWithDifferentMealLabel_createsNewExtraction() {
        UUID existingExtractionId = UUID.randomUUID();
        MealExtraction existingExtraction = MealExtraction.builder()
                .id(existingExtractionId)
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw("almocei arroz e feijao")
                .mealLabel("almoço")
                .totalKcal(new BigDecimal("400"))
                .extractedAt(LocalDateTime.now().minusMinutes(20))
                .build();

        when(mealExtractionRepository.findFirstByPatientIdAndNutritionistIdAndExtractedAtAfterOrderByExtractedAtDesc(
                eq(patientId), eq(nutritionistId), any(LocalDateTime.class)))
                .thenReturn(Optional.of(existingExtraction));

        ExtractionResult dinnerResult = new ExtractionResult(
                "jantar",
                List.of(new ExtractionItemResult("sopa", 300.0, 150, 6, 20, 4)),
                "jantei sopa"
        );

        MealExtraction newExtraction = MealExtraction.builder()
                .id(UUID.randomUUID())
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .mealLabel("jantar")
                .totalKcal(new BigDecimal("150"))
                .totalProt(new BigDecimal("6"))
                .totalCarb(new BigDecimal("20"))
                .totalFat(new BigDecimal("4"))
                .build();
        when(mealExtractionRepository.save(argThat(m -> m.getId() == null))).thenReturn(newExtraction);
        when(extractionItemRepository.save(any(ExtractionItem.class))).thenAnswer(i -> i.getArgument(0));
        when(episodeHistoryEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(i -> i.getArgument(0));

        MealExtraction result = extractionService.extractAndSave(
                messageId, patientId, nutritionistId, episodeId, dinnerResult);

        assertNotNull(result);
        assertNotEquals(existingExtractionId, result.getId());
        assertEquals("jantar", result.getMealLabel());

        // Did not delete old items
        verify(extractionItemRepository, never()).deleteAllByExtractionId(existingExtractionId);
    }

    @Test
    void extractAndSave_withJevSanityFlag_savesSanityStatusAndNote() {
        ExtractionResult extractionResult = new ExtractionResult(
                "almoço",
                List.of(new ExtractionItemResult("hambúrguer triplo", 800.0, 9500, 120, 300, 250)),
                "Comi 15 hambúrgueres triplos"
        );

        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.validateMealSanity(anyString(), anyString(), anyDouble(), anyDouble(), anyList()))
                .thenReturn(new com.compas.api.dto.jev.JevMealSanityDecision(
                        false, 0.95, "EXCESSIVE_CALORIES", "Calorias excessivas para uma única refeição", true));

        when(mealExtractionRepository.findFirstByPatientIdAndNutritionistIdAndExtractedAtAfterOrderByExtractedAtDesc(
                any(), any(), any())).thenReturn(Optional.empty());

        ArgumentCaptor<MealExtraction> captor = ArgumentCaptor.forClass(MealExtraction.class);
        when(mealExtractionRepository.save(captor.capture())).thenAnswer(i -> {
            MealExtraction me = i.getArgument(0);
            me.setId(UUID.randomUUID());
            return me;
        });

        extractionService.extractAndSave(messageId, patientId, nutritionistId, episodeId, extractionResult);

        MealExtraction captured = captor.getValue();
        assertEquals("EXCESSIVE_CALORIES", captured.getSanityStatus());
        assertEquals("Calorias excessivas para uma única refeição", captured.getSanityNote());
    }
}