package com.nutriai.api.service;

import com.nutriai.api.dto.whatsapp.*;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.ExtractionItem;
import com.nutriai.api.model.MealExtraction;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.WhatsAppMessage;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.ExtractionItemRepository;
import com.nutriai.api.repository.MealExtractionRepository;
import com.nutriai.api.repository.PatientRepository;
import com.nutriai.api.repository.WhatsAppMessageRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for WhatsApp Intelligence endpoints per D-15, D-21, D-23.
 * Provides extraction listing, correction, activation links, and status.
 */
@Service
public class WhatsAppIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppIntelligenceService.class);

    private final MealExtractionRepository mealExtractionRepository;
    private final ExtractionItemRepository extractionItemRepository;
    private final PatientRepository patientRepository;
    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final EpisodeHistoryEventRepository episodeHistoryEventRepository;
    private final ObjectMapper objectMapper;

    @Value("${nutriai.whatsapp.central-number:}")
    private String centralNumber;

    public WhatsAppIntelligenceService(
            MealExtractionRepository mealExtractionRepository,
            ExtractionItemRepository extractionItemRepository,
            PatientRepository patientRepository,
            WhatsAppMessageRepository whatsAppMessageRepository,
            EpisodeHistoryEventRepository episodeHistoryEventRepository) {
        this.mealExtractionRepository = mealExtractionRepository;
        this.extractionItemRepository = extractionItemRepository;
        this.patientRepository = patientRepository;
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.episodeHistoryEventRepository = episodeHistoryEventRepository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Get today's extractions for a patient, scoped by nutritionistId (D-23, D-14).
     */
    public List<ExtractionDTO> getExtractionsToday(UUID patientId, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Paciente não encontrado"));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<MealExtraction> extractions = mealExtractionRepository
                .findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                        patientId, nutritionistId, startOfDay, endOfDay);

        return extractions.stream()
                .map(this::toExtractionDTO)
                .toList();
    }

    /**
     * Correct an extraction: replace items and recalculate totals per D-12, D-21.
     */
    @Transactional
    public ExtractionDTO correctExtraction(UUID patientId, UUID nutritionistId,
                                           UUID extractionId, PatchExtractionRequest request) {
        // Tenant isolation: verify patient belongs to this nutritionist
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Paciente não encontrado"));

        MealExtraction extraction = mealExtractionRepository
                .findByIdAndPatientIdAndNutritionistId(extractionId, patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Extração não encontrada"));

        // 1. Delete existing items and save new ones
        extractionItemRepository.deleteAllByExtractionId(extractionId);

        BigDecimal totalKcal = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        for (int i = 0; i < request.items().size(); i++) {
            PatchExtractionRequest.PatchExtractionItem reqItem = request.items().get(i);
            ExtractionItem item = ExtractionItem.builder()
                    .extractionId(extractionId)
                    .name(reqItem.name())
                    .kcal(reqItem.kcal() != null ? reqItem.kcal() : BigDecimal.ZERO)
                    .prot(reqItem.prot() != null ? reqItem.prot() : BigDecimal.ZERO)
                    .carb(reqItem.carb() != null ? reqItem.carb() : BigDecimal.ZERO)
                    .fat(reqItem.fat() != null ? reqItem.fat() : BigDecimal.ZERO)
                    .grams(reqItem.grams())
                    .sortOrder(i)
                    .build();
            extractionItemRepository.save(item);

            totalKcal = totalKcal.add(item.getKcal());
            totalProt = totalProt.add(item.getProt());
            totalCarb = totalCarb.add(item.getCarb());
            totalFat = totalFat.add(item.getFat());
        }

        // 2. Update MealExtraction totals
        extraction.setTotalKcal(totalKcal);
        extraction.setTotalProt(totalProt);
        extraction.setTotalCarb(totalCarb);
        extraction.setTotalFat(totalFat);
        mealExtractionRepository.save(extraction);

        // 3. Update EpisodeHistoryEvent metadataJson
        updateHistoryEventMetadata(extraction, request);

        log.info("Corrected extraction id={}, new totals: kcal={}, prot={}, carb={}, fat={}",
                extractionId, totalKcal, totalProt, totalCarb, totalFat);

        // Re-fetch with new items for DTO
        return toExtractionDTO(mealExtractionRepository.findById(extractionId).orElse(extraction));
    }

    /**
     * Generate WhatsApp activation link for a patient per D-15.
     */
    public ActivationLinkDTO getActivationLink(UUID patientId, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Paciente não encontrado"));

        if (patient.getWhatsapp() == null || patient.getWhatsapp().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "WhatsApp não cadastrado");
        }

        // Normalize phone: strip non-digits, remove leading 55
        String phone = patient.getWhatsapp().replaceAll("\\D", "");
        if (phone.startsWith("55") && phone.length() > 10) {
            phone = phone.substring(2);
        }

        String targetPhone;
        if (centralNumber != null && !centralNumber.isBlank()) {
            String normalizedCentral = centralNumber.replaceAll("\\D", "");
            targetPhone = normalizedCentral.startsWith("55") ? normalizedCentral : "55" + normalizedCentral;
        } else {
            targetPhone = "55" + phone;
        }

        String link = "https://wa.me/" + targetPhone + "?text=Oi";
        boolean isActivated = whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId);

        return new ActivationLinkDTO(link, patient.getWhatsapp(), isActivated);
    }

    /**
     * Get WhatsApp status for the current nutritionist per D-23.
     * Uses efficient DB queries instead of iterating patients.
     */
    public WhatsAppStatusDTO getWhatsAppStatus(UUID nutritionistId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // Count today's extractions
        long extractionsToday = mealExtractionRepository
                .countByNutritionistIdAndExtractedAtBetween(nutritionistId, startOfDay, endOfDay);

        // Count distinct patients with at least one processed message
        long activePatientsCount = whatsAppMessageRepository
                .countDistinctPatientIdByNutritionistIdAndProcessedTrue(nutritionistId);

        // Check connectivity: any webhook in last 24h
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        boolean connected = whatsAppMessageRepository
                .existsByNutritionistIdAndCreatedAtAfter(nutritionistId, twentyFourHoursAgo);

        // Get last webhook timestamp
        LocalDateTime lastWebhookAt = whatsAppMessageRepository
                .findTopByNutritionistIdOrderByCreatedAtDesc(nutritionistId)
                .map(WhatsAppMessage::getCreatedAt)
                .orElse(null);

        return new WhatsAppStatusDTO(connected, (int) extractionsToday, (int) activePatientsCount, lastWebhookAt);
    }

    private ExtractionDTO toExtractionDTO(MealExtraction extraction) {
        List<ExtractionItem> items = extractionItemRepository
                .findByExtractionIdOrderBySortOrder(extraction.getId());

        List<ExtractionItemDTO> itemDTOs = items.stream()
                .map(item -> new ExtractionItemDTO(
                        item.getName(),
                        item.getKcal(),
                        item.getProt(),
                        item.getCarb(),
                        item.getFat(),
                        item.getGrams(),
                        item.getSortOrder()))
                .toList();

        return new ExtractionDTO(
                extraction.getId(),
                extraction.getMealLabel(),
                extraction.getExtractionRaw(),
                itemDTOs,
                extraction.getTotalKcal(),
                extraction.getTotalProt(),
                extraction.getTotalCarb(),
                extraction.getTotalFat(),
                extraction.getExtractedAt());
    }

    private void updateHistoryEventMetadata(MealExtraction extraction, PatchExtractionRequest request) {
        List<EpisodeHistoryEvent> events = episodeHistoryEventRepository
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(
                        extraction.getEpisodeId(), extraction.getNutritionistId());

        for (EpisodeHistoryEvent event : events) {
            if ("MEAL_EXTRACTION".equals(event.getEventType())
                    && extraction.getId().toString().equals(event.getSourceRef())) {
                try {
                    var metadata = new java.util.LinkedHashMap<String, Object>();
                    metadata.put("mealLabel", extraction.getMealLabel());
                    metadata.put("items", request.items().stream()
                            .map(item -> java.util.Map.of(
                                    "name", (Object) item.name(),
                                    "kcal", item.kcal(),
                                    "prot", item.prot(),
                                    "carb", item.carb(),
                                    "fat", item.fat(),
                                    "grams", item.grams() != null ? item.grams() : BigDecimal.ZERO))
                            .toList());
                    metadata.put("totals", java.util.Map.of(
                            "kcal", extraction.getTotalKcal(),
                            "prot", extraction.getTotalProt(),
                            "carb", extraction.getTotalCarb(),
                            "fat", extraction.getTotalFat()));
                    event.setMetadataJson(objectMapper.writeValueAsString(metadata));
                    episodeHistoryEventRepository.save(event);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to update history event metadata: {}", e.getMessage());
                }
                break;
            }
        }
    }
}