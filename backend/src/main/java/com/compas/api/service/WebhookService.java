package com.compas.api.service;

import com.compas.api.dto.whatsapp.WebhookMessageDTO;
import com.compas.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.compas.api.model.Episode;
import com.compas.api.model.Patient;
import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Core service that processes incoming WhatsApp webhook payloads.
 * Persists messages, resolves patients by phone, and enqueues for async processing.
 */
@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final PhoneNormalizationService phoneNormalizationService;
    private final MessageQueueService messageQueueService;
    private final EvolutionApiService evolutionApiService;
    private final com.compas.api.repository.WhatsAppInstanceRepository whatsAppInstanceRepository;

    @Value("${compas.whatsapp.unknown-response-enabled:${nutriai.whatsapp.unknown-response-enabled:true}}")
    private boolean unknownResponseEnabled = true;

    @Value("${compas.whatsapp.unknown-response-template:"
            + "${nutriai.whatsapp.unknown-response-template:Olá! Sou a assistente inteligente do Compas 🧭. "
            + "Ainda não localizei seu WhatsApp cadastrado com nenhum nutricionista na nossa plataforma.\n\n"
            + "Por favor, peça ao seu nutricionista para cadastrar seu número no painel Compas "
            + "para que possamos começar a acompanhar seu plano alimentar!}}")
    private String unknownResponseTemplate = "Olá! Sou a assistente inteligente do Compas 🧭. "
            + "Ainda não localizei seu WhatsApp cadastrado com nenhum nutricionista na nossa plataforma.\n\n"
            + "Por favor, peça ao seu nutricionista para cadastrar seu número no painel Compas "
            + "para que possamos começar a acompanhar seu plano alimentar!";

    public WebhookService(
            WhatsAppMessageRepository whatsAppMessageRepository,
            PatientRepository patientRepository,
            EpisodeRepository episodeRepository,
            PhoneNormalizationService phoneNormalizationService,
            MessageQueueService messageQueueService,
            EvolutionApiService evolutionApiService,
            com.compas.api.repository.WhatsAppInstanceRepository whatsAppInstanceRepository) {
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.phoneNormalizationService = phoneNormalizationService;
        this.messageQueueService = messageQueueService;
        this.evolutionApiService = evolutionApiService;
        this.whatsAppInstanceRepository = whatsAppInstanceRepository;
    }

    /**
     * Process an incoming webhook payload.
     * Returns the persisted message ID, or empty if dedup or non-processable event.
     */
    @Transactional
    public Optional<WebhookMessageDTO> processIncoming(WhatsAppWebhookDTO payload) {
        if (payload == null || payload.getData() == null || payload.getData().getInfo() == null) {
            log.warn("Received invalid webhook payload: payload={}, data={}",
                    payload != null ? payload.getEvent() : "null",
                    payload != null ? payload.getData() : "null");
            return Optional.empty();
        }

        // Only process incoming messages
        if (!"Message".equalsIgnoreCase(payload.getEvent())) {
            log.debug("Ignoring non-Message event: {}", payload.getEvent());
            return Optional.empty();
        }

        // Ignore messages sent by our own instance (AI responses)
        if (payload.getData().getInfo().isFromMe()) {
            log.debug("Ignoring message sent by our own instance");
            return Optional.empty();
        }

        String rawPhone = resolveSenderPhone(payload.getData().getInfo());
        String evolutionMessageId = payload.getData().getInfo().getId();
        String instanceId = payload.getInstanceId();

        if (evolutionMessageId == null || rawPhone == null) {
            log.warn("Webhook missing messageId or sender phone");
            return Optional.empty();
        }

        // Deduplication: check if this message ID already exists
        Optional<WhatsAppMessage> existing = whatsAppMessageRepository.findByMessageId(evolutionMessageId);
        if (existing.isPresent()) {
            log.info("Duplicate messageId {}, skipping", evolutionMessageId);
            return Optional.empty();
        }

        // Normalize phone and resolve patient
        Optional<String> normalizedOpt = phoneNormalizationService.normalize(rawPhone);
        if (normalizedOpt.isEmpty()) {
            log.warn("Could not normalize sender phone for messageId={}", evolutionMessageId);
            return Optional.empty();
        }
        String normalizedPhone = normalizedOpt.get();

        List<UUID> matchedNutritionistIds = patientRepository.findDistinctNutritionistIdsByWhatsapp(normalizedPhone);
        Optional<Patient> patientOpt;
        if (matchedNutritionistIds.size() > 1) {
            log.info("Resolving ambiguous patient for phone ending {} across {} nutritionists",
                    maskedSuffix(normalizedPhone), matchedNutritionistIds.size());
            patientOpt = resolveAmbiguousPatient(normalizedPhone, matchedNutritionistIds);
            if (patientOpt.isEmpty()) {
                log.warn("Ambiguous patient unresolved for messageId={} and phone ending {}",
                        evolutionMessageId, maskedSuffix(normalizedPhone));
            }
        } else if (matchedNutritionistIds.size() == 1) {
            patientOpt = patientRepository.findByWhatsappAndNutritionistId(
                    normalizedPhone, matchedNutritionistIds.get(0));
        } else {
            patientOpt = Optional.empty();
        }

        // Determine message type and content
        String messageType = determineMessageType(payload);
        String messageContent = extractContent(payload);
        String mediaUrl = extractMediaUrl(payload);

        // For audio and image messages, decrypt media directly via Evolution Go /message/downloadmedia
        if (("audio".equals(messageType) || "image".equals(messageType))
                && payload.getData() != null && payload.getData().getMessage() != null) {
            Optional<String> downloaded = evolutionApiService.downloadMediaDataUrl(payload.getData().getMessage());
            if (downloaded.isPresent()) {
                mediaUrl = downloaded.get();
                log.info("Decrypted {} media successfully via Evolution Go", messageType);
            }
        }

        WhatsAppMessage message = WhatsAppMessage.builder()
                .messageId(evolutionMessageId)
                .instanceId(instanceId != null ? instanceId : "default")
                .senderPhone(rawPhone)
                .senderPhoneNormalized(normalizedPhone)
                .patientId(patientOpt.map(Patient::getId).orElse(null))
                .nutritionistId(patientOpt.map(Patient::getNutritionistId).orElse(null))
                .messageType(messageType)
                .messageContent(messageContent)
                .mediaUrl(mediaUrl)
                .processed(false)
                .build();

        // For unknown senders, check 24h debounce window before persisting current message
        boolean alreadyNotified = false;
        if (patientOpt.isEmpty()) {
            alreadyNotified = whatsAppMessageRepository
                    .existsBySenderPhoneNormalizedAndPatientIdIsNullAndCreatedAtAfter(
                            normalizedPhone, LocalDateTime.now().minusHours(24));
        }

        WhatsAppMessage saved = whatsAppMessageRepository.save(message);
        log.info("Saved WhatsAppMessage id={}, patientId={}, type={}",
                saved.getId(), saved.getPatientId(), messageType);

        // Unknown number: mark processed, notify once per 24h window, no enqueue per D-16
        if (patientOpt.isEmpty()) {
            saved.setProcessed(true);
            saved.setProcessedAt(LocalDateTime.now());
            whatsAppMessageRepository.save(saved);
            log.info("Unknown phone {}, marked processed without enqueue", normalizedPhone);

            if (unknownResponseEnabled && !alreadyNotified) {
                String responseText = unknownResponseTemplate != null
                        ? unknownResponseTemplate.replace("\\n", "\n") : "";
                evolutionApiService.sendMessage(normalizedPhone, responseText);
                log.info("Sent unknown patient notice to phone ending {}", maskedSuffix(normalizedPhone));
            } else if (unknownResponseEnabled) {
                log.debug("Unknown patient notice debounced for phone ending {}", maskedSuffix(normalizedPhone));
            }

            return Optional.of(new WebhookMessageDTO(
                    saved.getId(), normalizedPhone, null, null, messageContent, messageType));
        }

        // Sticky binding: if patient has no whatsappInstanceId yet, bind to incoming instance if known
        if (instanceId != null && !instanceId.isBlank()) {
            Patient patient = patientOpt.get();
            if (patient.getWhatsappInstanceId() == null) {
                whatsAppInstanceRepository.findByName(instanceId).ifPresent(inst -> {
                    patient.setWhatsappInstanceId(inst.getId());
                    patientRepository.save(patient);
                    log.info("Sticky binding: patient {} bound to WhatsApp fleet instance '{}'", patient.getId(), inst.getName());
                });
            }
        }

        // Enqueue for async AI processing after transaction commits
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            messageQueueService.enqueue(saved.getId());
                            log.info("Enqueued message {} for async processing", saved.getId());
                        }
                    }
            );
        } else {
            messageQueueService.enqueue(saved.getId());
            log.info("Enqueued message {} for async processing", saved.getId());
        }

        return Optional.of(new WebhookMessageDTO(
                saved.getId(), normalizedPhone, saved.getPatientId(), saved.getNutritionistId(),
                messageContent, messageType));
    }

    private String resolveSenderPhone(WhatsAppWebhookDTO.WhatsAppInfo info) {
        if (info == null) {
            return null;
        }
        String senderPhone = extractPhoneFromJid(info.getSender());
        if (senderPhone == null || isLid(info.getSender())) {
            String altPhone = extractPhoneFromJid(info.getSenderAlt());
            if (altPhone != null && !isLid(info.getSenderAlt())) {
                return altPhone;
            }
            String chatPhone = extractPhoneFromJid(info.getChat());
            if (chatPhone != null && !isLid(info.getChat())) {
                return chatPhone;
            }
        }
        return senderPhone;
    }

    private boolean isLid(String jid) {
        return jid != null && (jid.endsWith("@lid") || jid.contains("@lid"));
    }

    private String extractPhoneFromJid(String sender) {
        if (sender == null) {
            return null;
        }
        int atIndex = sender.indexOf('@');
        if (atIndex > 0) {
            return sender.substring(0, atIndex);
        }
        return sender;
    }

    private String determineMessageType(WhatsAppWebhookDTO payload) {
        if (payload.getData() == null || payload.getData().getInfo() == null) {
            return "text";
        }
        String mediaType = payload.getData().getInfo().getMediaType();
        if ("audio".equalsIgnoreCase(mediaType)) {
            return "audio";
        }
        if ("image".equalsIgnoreCase(mediaType)) {
            return "image";
        }
        if ("video".equalsIgnoreCase(mediaType)) {
            return "video";
        }
        if ("document".equalsIgnoreCase(mediaType)) {
            return "document";
        }
        if (payload.getData().getMessage() != null) {
            if (payload.getData().getMessage().getAudioMessage() != null) {
                return "audio";
            }
            if (payload.getData().getMessage().getImageMessage() != null) {
                return "image";
            }
        }
        return "text";
    }

    private String extractContent(WhatsAppWebhookDTO payload) {
        if (payload.getData().getMessage() == null) {
            return null;
        }
        if (payload.getData().getMessage().getConversation() != null) {
            return payload.getData().getMessage().getConversation();
        }
        if (payload.getData().getMessage().getExtendedTextMessage() != null
                && payload.getData().getMessage().getExtendedTextMessage().getText() != null) {
            return payload.getData().getMessage().getExtendedTextMessage().getText();
        }
        if (payload.getData().getMessage().getImageMessage() != null
                && payload.getData().getMessage().getImageMessage().getCaption() != null) {
            return payload.getData().getMessage().getImageMessage().getCaption();
        }
        return null;
    }

    private String extractMediaUrl(WhatsAppWebhookDTO payload) {
        if (payload.getData().getMessage() == null) {
            return null;
        }
        if (payload.getData().getMessage().getImageMessage() != null) {
            var img = payload.getData().getMessage().getImageMessage();
            if (img.getUrl() != null && !img.getUrl().isBlank()) {
                return img.getUrl();
            }
            if (img.getBase64() != null && !img.getBase64().isBlank()) {
                String mime = img.getMimeType() != null ? img.getMimeType() : "image/jpeg";
                return "data:" + mime + ";base64," + img.getBase64();
            }
        }
        if (payload.getData().getMessage().getAudioMessage() != null) {
            var audio = payload.getData().getMessage().getAudioMessage();
            if (audio.getUrl() != null && !audio.getUrl().isBlank()) {
                return audio.getUrl();
            }
            if (audio.getBase64() != null && !audio.getBase64().isBlank()) {
                String mime = audio.getMimeType() != null ? audio.getMimeType() : "audio/ogg";
                return "data:" + mime + ";base64," + audio.getBase64();
            }
        }
        return null;
    }

    private String maskedSuffix(String normalizedPhone) {
        if (normalizedPhone == null || normalizedPhone.length() < 4) {
            return "***";
        }
        return "***" + normalizedPhone.substring(normalizedPhone.length() - 4);
    }

    private Optional<Patient> resolveAmbiguousPatient(String normalizedPhone, List<UUID> nutritionistIds) {
        Patient bestMatch = null;
        LocalDateTime latestEpisodeStart = null;

        for (UUID nutId : nutritionistIds) {
            Optional<Patient> pOpt = patientRepository.findByWhatsappAndNutritionistId(normalizedPhone, nutId);
            if (pOpt.isPresent()) {
                Patient p = pOpt.get();
                if (Boolean.TRUE.equals(p.getActive())) {
                    Optional<Episode> activeEpisode = episodeRepository
                            .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                                    p.getId(), nutId);
                    if (activeEpisode.isPresent()) {
                        LocalDateTime start = activeEpisode.get().getStartDate();
                        if (latestEpisodeStart == null || (start != null && start.isAfter(latestEpisodeStart))) {
                            latestEpisodeStart = start;
                            bestMatch = p;
                        }
                    } else if (bestMatch == null) {
                        bestMatch = p;
                    }
                }
            }
        }
        return Optional.ofNullable(bestMatch);
    }
}
