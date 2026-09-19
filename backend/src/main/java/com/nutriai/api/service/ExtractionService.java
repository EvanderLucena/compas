package com.nutriai.api.service;

import com.nutriai.api.dto.llm.ExtractionItemResult;
import com.nutriai.api.dto.llm.ExtractionResult;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.ExtractionItem;
import com.nutriai.api.model.MealExtraction;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.ExtractionItemRepository;
import com.nutriai.api.repository.MealExtractionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persists extracted meal data and emits timeline events per D-11, D-13.
 * Extractions are authoritative — saved directly as confirmed (D-11).
 */
@Service
public class ExtractionService {

    private static final Logger log = LoggerFactory.getLogger(ExtractionService.class);

    private final MealExtractionRepository mealExtractionRepository;
    private final ExtractionItemRepository extractionItemRepository;
    private final EpisodeHistoryEventRepository episodeHistoryEventRepository;
    private final JevService jevService;
    private final ObjectMapper objectMapper;

    public ExtractionService(
            MealExtractionRepository mealExtractionRepository,
            ExtractionItemRepository extractionItemRepository,
            EpisodeHistoryEventRepository episodeHistoryEventRepository,
            JevService jevService) {
        this.mealExtractionRepository = mealExtractionRepository;
        this.extractionItemRepository = extractionItemRepository;
        this.episodeHistoryEventRepository = episodeHistoryEventRepository;
        this.jevService = jevService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Extract meal data from LLM response, persist all items, and emit EpisodeHistoryEvent.
     *
     * @param messageId        the WhatsAppMessage ID
     * @param patientId        the patient ID
     * @param nutritionistId   the nutritionist ID
     * @param episodeId        the active episode ID
     * @param extractionResult the structured extraction from LLM
     * @return the saved MealExtraction
     */
    @Transactional
    public MealExtraction extractAndSave(
            UUID messageId,
            UUID patientId,
            UUID nutritionistId,
            UUID episodeId,
            ExtractionResult extractionResult) {

        // 1. Calculate total macros from items
        BigDecimal totalKcal = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        List<ExtractionItemResult> items = extractionResult.items();
        double totalGrams = 0.0;
        List<String> itemNames = new java.util.ArrayList<>();
        if (items != null) {
            for (ExtractionItemResult item : items) {
                totalKcal = totalKcal.add(BigDecimal.valueOf(item.kcal()));
                totalProt = totalProt.add(BigDecimal.valueOf(item.prot()));
                totalCarb = totalCarb.add(BigDecimal.valueOf(item.carb()));
                totalFat = totalFat.add(BigDecimal.valueOf(item.fat()));
                if (item.grams() != null) {
                    totalGrams += item.grams();
                }
                if (item.name() != null) {
                    itemNames.add(item.name());
                }
            }
        }

        // Validate meal sanity via Jev AI (TypeSafe System One)
        String sanityStatus = "VERIFIED";
        String sanityNote = null;
        if (jevService != null && jevService.isAvailable()) {
            try {
                var sanity = jevService.validateMealSanity(
                        extractionResult.extractionRaw(),
                        extractionResult.mealLabel(),
                        totalKcal.doubleValue(),
                        totalGrams,
                        itemNames
                );
                if (sanity != null && sanity.success()) {
                    sanityStatus = sanity.isPlausible() ? "VERIFIED" : sanity.riskFlag();
                    sanityNote = sanity.observation();
                }
            } catch (Exception ex) {
                log.warn("Jev meal sanity check failed: {}", ex.getMessage());
            }
        }

        // 2. Check for recent extraction within 45 minutes to consolidate/deduplicate
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(45);
        Optional<MealExtraction> recentOpt = mealExtractionRepository
                .findFirstByPatientIdAndNutritionistIdAndExtractedAtAfterOrderByExtractedAtDesc(
                        patientId, nutritionistId, cutoff);

        if (recentOpt.isPresent() && isSameMeal(recentOpt.get().getMealLabel(), extractionResult.mealLabel())) {
            MealExtraction existing = recentOpt.get();
            log.info("Consolidating into existing MealExtraction id={}, patientId={}, existingLabel={}, newLabel={}",
                    existing.getId(), patientId, existing.getMealLabel(), extractionResult.mealLabel());

            existing.setMessageId(messageId);
            existing.setExtractionRaw(extractionResult.extractionRaw());
            if (extractionResult.mealLabel() != null && !isGenericLabel(normalizeLabel(extractionResult.mealLabel()))) {
                existing.setMealLabel(extractionResult.mealLabel());
            }
            existing.setTotalKcal(totalKcal);
            existing.setTotalProt(totalProt);
            existing.setTotalCarb(totalCarb);
            existing.setTotalFat(totalFat);
            existing.setSanityStatus(sanityStatus);
            existing.setSanityNote(sanityNote);
            existing.setExtractedAt(LocalDateTime.now());
            MealExtraction saved = mealExtractionRepository.save(existing);

            extractionItemRepository.deleteAllByExtractionId(saved.getId());
            if (items != null) {
                for (int i = 0; i < items.size(); i++) {
                    ExtractionItemResult itemResult = items.get(i);
                    ExtractionItem item = ExtractionItem.builder()
                            .extractionId(saved.getId())
                            .name(itemResult.name())
                            .kcal(BigDecimal.valueOf(itemResult.kcal()))
                            .prot(BigDecimal.valueOf(itemResult.prot()))
                            .carb(BigDecimal.valueOf(itemResult.carb()))
                            .fat(BigDecimal.valueOf(itemResult.fat()))
                            .grams(itemResult.grams() != null ? BigDecimal.valueOf(itemResult.grams()) : null)
                            .sortOrder(i)
                            .build();
                    extractionItemRepository.save(item);
                }
            }

            updateOrEmitHistoryEvent(saved, extractionResult, nutritionistId, episodeId);
            return saved;
        }

        // 3. Create and persist new MealExtraction
        MealExtraction extraction = MealExtraction.builder()
                .messageId(messageId)
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(episodeId)
                .extractionRaw(extractionResult.extractionRaw())
                .mealLabel(extractionResult.mealLabel())
                .totalKcal(totalKcal)
                .totalProt(totalProt)
                .totalCarb(totalCarb)
                .totalFat(totalFat)
                .sanityStatus(sanityStatus)
                .sanityNote(sanityNote)
                .extractedAt(LocalDateTime.now())
                .build();

        MealExtraction saved = mealExtractionRepository.save(extraction);
        log.info("Saved MealExtraction id={}, patientId={}, mealLabel={}, totalKcal={}",
                saved.getId(), patientId, extractionResult.mealLabel(), totalKcal);

        // 4. Persist ExtractionItems
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                ExtractionItemResult itemResult = items.get(i);
                ExtractionItem item = ExtractionItem.builder()
                        .extractionId(saved.getId())
                        .name(itemResult.name())
                        .kcal(BigDecimal.valueOf(itemResult.kcal()))
                        .prot(BigDecimal.valueOf(itemResult.prot()))
                        .carb(BigDecimal.valueOf(itemResult.carb()))
                        .fat(BigDecimal.valueOf(itemResult.fat()))
                        .grams(itemResult.grams() != null ? BigDecimal.valueOf(itemResult.grams()) : null)
                        .sortOrder(i)
                        .build();
                extractionItemRepository.save(item);
            }
        }

        // 5. Emit EpisodeHistoryEvent per D-13
        emitHistoryEvent(saved, extractionResult, nutritionistId, episodeId);

        return saved;
    }

    private void updateOrEmitHistoryEvent(
            MealExtraction extraction,
            ExtractionResult extractionResult,
            UUID nutritionistId,
            UUID episodeId) {

        Optional<EpisodeHistoryEvent> existingEventOpt = episodeHistoryEventRepository
                .findBySourceRefAndNutritionistId(extraction.getId().toString(), nutritionistId);

        String mealLabel = extraction.getMealLabel();
        if (mealLabel == null || mealLabel.isBlank()) {
            mealLabel = "Refeição";
        }
        String capitalizedLabel = mealLabel.substring(0, 1).toUpperCase() + mealLabel.substring(1);
        String title = capitalizedLabel + " extraído via WhatsApp";
        String description = buildDescription(extractionResult);
        String metadataJson = buildMetadataJson(extractionResult, extraction);

        if (existingEventOpt.isPresent()) {
            EpisodeHistoryEvent event = existingEventOpt.get();
            event.setTitle(title);
            event.setDescription(description);
            event.setMetadataJson(metadataJson);
            event.setEventAt(extraction.getExtractedAt());
            episodeHistoryEventRepository.save(event);
            log.info("Updated existing MEAL_EXTRACTION event for extraction {}", extraction.getId());
        } else {
            emitHistoryEvent(extraction, extractionResult, nutritionistId, episodeId);
        }
    }

    private boolean isSameMeal(String existingLabel, String newLabel) {
        if (existingLabel == null || newLabel == null) {
            return true;
        }
        String cleanOld = normalizeLabel(existingLabel);
        String cleanNew = normalizeLabel(newLabel);
        if (cleanOld.equals(cleanNew)) {
            return true;
        }
        if (isGenericLabel(cleanOld) || isGenericLabel(cleanNew)) {
            return true;
        }
        return cleanOld.contains(cleanNew) || cleanNew.contains(cleanOld);
    }

    private String normalizeLabel(String label) {
        if (label == null) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(label.toLowerCase().trim(), java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }

    private boolean isGenericLabel(String label) {
        return label.isEmpty() || "refeicao".equals(label) || "comida".equals(label)
                || "prato".equals(label) || "alimento".equals(label);
    }

    /**
     * Emit a MEAL_EXTRACTION EpisodeHistoryEvent for the timeline.
     */
    private void emitHistoryEvent(
            MealExtraction extraction,
            ExtractionResult extractionResult,
            UUID nutritionistId,
            UUID episodeId) {

        String mealLabel = extractionResult.mealLabel();
        if (mealLabel == null || mealLabel.isBlank()) {
            mealLabel = "Refeição";
        }
        String capitalizedLabel = mealLabel.substring(0, 1).toUpperCase() + mealLabel.substring(1);

        String title = capitalizedLabel + " extraído via WhatsApp";

        // Build description: "4 itens: arroz, feijão, frango, salada"
        String description = buildDescription(extractionResult);

        // Build metadata JSON
        String metadataJson = buildMetadataJson(extractionResult, extraction);

        EpisodeHistoryEvent event = EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType("MEAL_EXTRACTION")
                .eventAt(extraction.getExtractedAt())
                .title(title)
                .description(description)
                .sourceRef(extraction.getId().toString())
                .metadataJson(metadataJson)
                .build();

        episodeHistoryEventRepository.save(event);
        log.info("Emitted MEAL_EXTRACTION event for extraction {}", extraction.getId());
    }

    private String buildDescription(ExtractionResult extractionResult) {
        if (extractionResult.items() == null || extractionResult.items().isEmpty()) {
            return "0 itens";
        }
        int count = extractionResult.items().size();
        String itemNames = extractionResult.items().stream()
                .map(ExtractionItemResult::name)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
        return count + " itens: " + itemNames;
    }

    private String buildMetadataJson(ExtractionResult extractionResult, MealExtraction extraction) {
        try {
            var metadata = new java.util.LinkedHashMap<String, Object>();
            metadata.put("mealLabel", extractionResult.mealLabel());
            metadata.put("items", extractionResult.items());
            metadata.put("totals", java.util.Map.of(
                    "kcal", extraction.getTotalKcal(),
                    "prot", extraction.getTotalProt(),
                    "carb", extraction.getTotalCarb(),
                    "fat", extraction.getTotalFat()
            ));
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize extraction metadata: {}", e.getMessage());
            return "{}";
        }
    }
}
