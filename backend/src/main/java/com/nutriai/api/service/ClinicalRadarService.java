package com.nutriai.api.service;

import com.nutriai.api.dto.intelligence.AttentionItemDTO;
import com.nutriai.api.dto.intelligence.ClinicalRadarDTO;
import com.nutriai.api.dto.intelligence.RadarSummaryDTO;
import com.nutriai.api.dto.intelligence.SentimentDistributionDTO;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.WhatsAppMessage;
import com.nutriai.api.repository.MealExtractionRepository;
import com.nutriai.api.repository.PatientRepository;
import com.nutriai.api.repository.WhatsAppMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ClinicalRadarService {

    private static final Logger log = LoggerFactory.getLogger(ClinicalRadarService.class);

    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final PatientRepository patientRepository;
    private final MealExtractionRepository mealExtractionRepository;

    public ClinicalRadarService(
            WhatsAppMessageRepository whatsAppMessageRepository,
            PatientRepository patientRepository,
            MealExtractionRepository mealExtractionRepository) {
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.patientRepository = patientRepository;
        this.mealExtractionRepository = mealExtractionRepository;
    }

    @Transactional(readOnly = true)
    public ClinicalRadarDTO getClinicalRadar(UUID nutritionistId) {
        long totalPatients = patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId);

        List<WhatsAppMessage> attentionMsgs = whatsAppMessageRepository
                .findUnresolvedAttentionMessages(nutritionistId);

        List<AttentionItemDTO> attentionQueue = buildAttentionQueue(attentionMsgs, nutritionistId);

        SentimentDistributionDTO sentiments = buildSentimentDistribution(nutritionistId);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        long todayExtractions = mealExtractionRepository
                .countByNutritionistIdAndExtractedAtBetween(nutritionistId, startOfDay, endOfDay);

        boolean waConnected = whatsAppMessageRepository
                .existsByNutritionistIdAndCreatedAtAfter(nutritionistId, LocalDateTime.now().minusHours(24));

        RadarSummaryDTO summary = new RadarSummaryDTO(
                totalPatients,
                attentionQueue.size(),
                sentiments.struggling(),
                todayExtractions,
                waConnected
        );

        return new ClinicalRadarDTO(summary, attentionQueue, sentiments);
    }

    @Transactional
    public void resolveAttentionItem(UUID messageId, UUID nutritionistId) {
        WhatsAppMessage msg = whatsAppMessageRepository.findByIdAndNutritionistId(messageId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta não encontrado"));

        msg.setJevAttentionResolved(true);
        whatsAppMessageRepository.save(msg);
        log.info("Resolved attention alert for message {} (patient {})", messageId, msg.getPatientId());
    }

    private List<AttentionItemDTO> buildAttentionQueue(List<WhatsAppMessage> messages, UUID nutritionistId) {
        Map<UUID, Patient> patientCache = new HashMap<>();
        List<AttentionItemDTO> result = new ArrayList<>();

        for (WhatsAppMessage msg : messages) {
            String patientName = "Paciente";
            String patientPhone = msg.getSenderPhoneNormalized();

            if (msg.getPatientId() != null) {
                Patient p = patientCache.computeIfAbsent(msg.getPatientId(), id ->
                        patientRepository.findByIdAndNutritionistId(id, nutritionistId).orElse(null)
                );
                if (p != null) {
                    patientName = p.getName();
                    if (p.getWhatsapp() != null && !p.getWhatsapp().isBlank()) {
                        patientPhone = p.getWhatsapp();
                    }
                }
            }

            result.add(new AttentionItemDTO(
                    msg.getId(),
                    msg.getPatientId(),
                    patientName,
                    patientPhone,
                    msg.getMessageContent() != null ? msg.getMessageContent() : "",
                    msg.getJevIntent(),
                    msg.getJevIntentConfidence(),
                    msg.getJevSentiment(),
                    msg.getJevSentimentConfidence(),
                    msg.getJevAttentionScore(),
                    msg.getCreatedAt()
            ));
        }
        return result;
    }

    private SentimentDistributionDTO buildSentimentDistribution(UUID nutritionistId) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(14);
        List<Object[]> rows = whatsAppMessageRepository.countSentimentDistribution(nutritionistId, cutoff);

        long motivated = 0;
        long neutral = 0;
        long struggling = 0;
        long anxious = 0;

        for (Object[] row : rows) {
            String sentiment = row[0] != null ? row[0].toString() : "";
            long count = row[1] instanceof Number num ? num.longValue() : 0L;

            if (sentiment.contains("motivated") || sentiment.contains("positive") || sentiment.contains("confident")) {
                motivated += count;
            } else if (sentiment.contains("struggling") || sentiment.contains("guilty")) {
                struggling += count;
            } else if (sentiment.contains("anxious") || sentiment.contains("doubt")) {
                anxious += count;
            } else {
                neutral += count;
            }
        }

        return new SentimentDistributionDTO(motivated, neutral, struggling, anxious);
    }
}
