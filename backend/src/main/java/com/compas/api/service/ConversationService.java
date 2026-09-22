package com.compas.api.service;

import com.compas.api.dto.llm.ExtractionResult;
import com.compas.api.dto.llm.LlmIntent;
import com.compas.api.dto.llm.LlmRequest;
import com.compas.api.dto.llm.LlmResponse;
import com.compas.api.model.*;
import com.compas.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.compas.api.dto.jev.JevDecision;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrates the entire WhatsApp message processing pipeline per D-01.
 * Single LLM call per message handles both classification and response.
 */
@Service
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final LlmService llmService;
    private final ExtractionService extractionService;
    private final EvolutionApiService evolutionApiService;
    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final WhatsAppResponseRepository whatsAppResponseRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;
    private final PlanExtraRepository planExtraRepository;
    private final NutritionistRepository nutritionistRepository;
    private final AudioTranscriptionService audioTranscriptionService;
    private JevService jevService;
    private BiometryService biometryService;

    @Autowired(required = false)
    public void setJevService(JevService jevService) {
        this.jevService = jevService;
    }

    @Autowired(required = false)
    public void setBiometryService(BiometryService biometryService) {
        this.biometryService = biometryService;
    }

    public ConversationService(
            LlmService llmService,
            ExtractionService extractionService,
            EvolutionApiService evolutionApiService,
            WhatsAppMessageRepository whatsAppMessageRepository,
            WhatsAppResponseRepository whatsAppResponseRepository,
            PatientRepository patientRepository,
            EpisodeRepository episodeRepository,
            MealPlanRepository mealPlanRepository,
            MealSlotRepository mealSlotRepository,
            MealOptionRepository mealOptionRepository,
            MealFoodRepository mealFoodRepository,
            PlanExtraRepository planExtraRepository,
            NutritionistRepository nutritionistRepository,
            AudioTranscriptionService audioTranscriptionService) {
        this.llmService = llmService;
        this.extractionService = extractionService;
        this.evolutionApiService = evolutionApiService;
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.whatsAppResponseRepository = whatsAppResponseRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.mealFoodRepository = mealFoodRepository;
        this.planExtraRepository = planExtraRepository;
        this.nutritionistRepository = nutritionistRepository;
        this.audioTranscriptionService = audioTranscriptionService;
    }

    /**
     * Process a WhatsApp message end-to-end:
     * 1. Load message
     * 2. Classify intent via LLM
     * 3. Extract meal data (if applicable)
     * 4. Save response
     * 5. Send via Evolution API
     * 6. Mark processed
     */
    @Transactional
    public void processMessage(UUID messageId) {
        // 1. Load WhatsAppMessage by ID
        Optional<WhatsAppMessage> messageOpt = whatsAppMessageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            log.warn("Message {} not found, skipping", messageId);
            return;
        }

        WhatsAppMessage message = messageOpt.get();

        // 2. If patientId is null → unknown sender → no response (D-16)
        if (message.getPatientId() == null) {
            log.info("Unknown sender for message {}, skipping (D-16)", messageId);
            markProcessed(message);
            return;
        }

        // 3. Load Patient and Nutritionist
        Optional<Patient> patientOpt = patientRepository.findByIdAndNutritionistId(
                message.getPatientId(), message.getNutritionistId());
        if (patientOpt.isEmpty()) {
            log.warn("Patient {} not found for message {}, skipping", message.getPatientId(), messageId);
            markProcessed(message);
            return;
        }
        Patient patient = patientOpt.get();

        Optional<Nutritionist> nutritionistOpt = nutritionistRepository.findById(message.getNutritionistId());
        if (nutritionistOpt.isEmpty()) {
            log.warn("Nutritionist {} not found for message {}, skipping", message.getNutritionistId(), messageId);
            markProcessed(message);
            return;
        }
        Nutritionist nutritionist = nutritionistOpt.get();

        // 3.1 If patient is paused/inactive → do not process with LLM, send polite direct contact notification
        if (Boolean.FALSE.equals(patient.getActive())) {
            log.info("Patient {} is inactive/paused, sending direct contact message", patient.getId());
            String contactText = "Olá, " + patient.getName() + "! Para te orientar da melhor forma e tirar suas dúvidas, " +
                    "por favor entre em contato diretamente com seu(sua) nutricionista, " +
                    nutritionist.getName() + ". Um abraço!";

            WhatsAppResponse waResponse = WhatsAppResponse.builder()
                    .messageId(messageId)
                    .nutritionistId(nutritionist.getId())
                    .patientId(patient.getId())
                    .responseType("PATIENT_INACTIVE")
                    .responseContent(contactText)
                    .build();
            whatsAppResponseRepository.save(waResponse);

            boolean sent = evolutionApiService.sendMessage(
                    message.getSenderPhoneNormalized(),
                    contactText
            );
            if (sent) {
                waResponse.setSentAt(LocalDateTime.now());
                whatsAppResponseRepository.save(waResponse);
            }
            markProcessed(message);
            return;
        }

        // 4. Check if this is the first message from this patient
        boolean isFirstMessage = isFirstMessageFromPatient(message.getPatientId());

        // 5. Build the appropriate system prompt and call LLM
        String systemPrompt;
        String responseType;
        String userMessage = message.getMessageContent() != null ? message.getMessageContent() : "";
        String imageUrl = null;

        if (isFirstMessage) {
            // First interaction → greeting prompt (D-17)
            systemPrompt = buildGreetingPrompt(patient.getName(), nutritionist.getName());
            responseType = "GREETING";
        } else if ("audio".equals(message.getMessageType())) {
            // Check if audio has already been transcribed or can be transcribed via Whisper
            Optional<String> transcribedOpt = Optional.empty();
            if (message.getMessageContent() != null && !message.getMessageContent().isBlank()) {
                transcribedOpt = Optional.of(message.getMessageContent());
            } else if (message.getMediaUrl() != null && !message.getMediaUrl().isBlank()) {
                Optional<byte[]> audioBytes = evolutionApiService.downloadMedia(message.getMediaUrl());
                if (audioBytes.isPresent()) {
                    transcribedOpt = audioTranscriptionService.transcribe(audioBytes.get(), "audio.ogg");
                    transcribedOpt.ifPresent(text -> {
                        message.setMessageContent(text);
                        whatsAppMessageRepository.save(message);
                    });
                }
            }

            if (transcribedOpt.isPresent() && !transcribedOpt.get().isBlank()) {
                userMessage = transcribedOpt.get();
                runJevTriageIfAvailable(message, userMessage);
                if (handleEmergencyEscalationIfTriggered(messageId, message, patient, nutritionist)) {
                    return;
                }
                systemPrompt = buildClassifyingPrompt(patient, nutritionist, message);
                responseType = "CONVERSATION";
            } else {
                // Audio without transcription available → acknowledgment prompt (D-05)
                systemPrompt = buildAcknowledgmentPrompt("áudio");
                responseType = "ACKNOWLEDGMENT";
            }
        } else if ("image".equals(message.getMessageType())) {
            Optional<String> imageUriOpt = Optional.empty();
            if (message.getMediaUrl() != null && !message.getMediaUrl().isBlank()) {
                imageUriOpt = evolutionApiService.getMediaAsBase64DataUri(message.getMediaUrl(), "image/jpeg");
            }

            if (imageUriOpt.isPresent()) {
                imageUrl = imageUriOpt.get();
                systemPrompt = buildPlateVisionPrompt(patient, nutritionist, message);
                responseType = "CONVERSATION";
                if (userMessage.isBlank()) {
                    userMessage = "Foto da refeição enviada pelo paciente";
                }
            } else if (message.getMessageContent() != null && !message.getMessageContent().isBlank()) {
                // Image with caption but no image URL → classify from caption (D-05)
                runJevTriageIfAvailable(message, userMessage);
                if (handleEmergencyEscalationIfTriggered(messageId, message, patient, nutritionist)) {
                    return;
                }
                systemPrompt = buildClassifyingPromptWithImageAck(patient, nutritionist, message);
                responseType = "CONVERSATION";
            } else {
                // Image without caption and without image URL → acknowledgment prompt (D-05)
                systemPrompt = buildAcknowledgmentPrompt("foto");
                responseType = "ACKNOWLEDGMENT";
            }
        } else {
            // Text message → classify and respond
            runJevTriageIfAvailable(message, userMessage);

            if (handleEmergencyEscalationIfTriggered(messageId, message, patient, nutritionist)) {
                return;
            }

            if (shouldFastTrackGreeting(message, userMessage)) {
                String greetingText = "Olá, " + patient.getName() + "! Tudo bem por aí? Como posso te ajudar com o seu plano hoje? 😊";
                WhatsAppResponse waResponse = WhatsAppResponse.builder()
                        .messageId(messageId)
                        .nutritionistId(nutritionist.getId())
                        .patientId(patient.getId())
                        .responseType("GREETING")
                        .responseContent(greetingText)
                        .build();
                whatsAppResponseRepository.save(waResponse);
                boolean sent = evolutionApiService.sendMessage(message.getSenderPhoneNormalized(), greetingText);
                if (sent) {
                    waResponse.setSentAt(LocalDateTime.now());
                    whatsAppResponseRepository.save(waResponse);
                }
                markProcessed(message);
                log.info("Message {} fast-tracked as GREETING via Jev triage", messageId);
                return;
            }

            systemPrompt = buildClassifyingPrompt(patient, nutritionist, message);
            responseType = "CONVERSATION";
        }

        LlmRequest llmRequest = new LlmRequest(systemPrompt, userMessage, imageUrl, 0.3, 1500);
        LlmResponse llmResponse = llmService.chat(llmRequest);

        if (!llmResponse.success()) {
            log.error("LLM call failed for message {}: {}", messageId, llmResponse.errorMessage());
            // Don't mark as processed — message stays for retry
            return;
        }

        // 6. If intent is MEAL_REPORT and extraction has items → save extraction
        if (llmResponse.intent() == LlmIntent.MEAL_REPORT && llmResponse.extraction() != null) {
            ExtractionResult extraction = llmResponse.extraction();
            Optional<Episode> activeEpisode = episodeRepository
                    .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                            patient.getId(), nutritionist.getId());

            if (activeEpisode.isPresent()) {
                List<ExtractionResult> mealsToSave = extraction.allMeals();
                for (ExtractionResult singleMeal : mealsToSave) {
                    if (singleMeal.items() != null && !singleMeal.items().isEmpty()) {
                        extractionService.extractAndSave(
                                messageId, patient.getId(), nutritionist.getId(),
                                activeEpisode.get().getId(), singleMeal);
                    }
                }
            } else {
                log.warn("No active episode for patient {}, extraction skipped but response sent",
                        patient.getId());
            }
            responseType = "MEAL_EXTRACTION";
        }

        // 7. Save WhatsAppResponse
        String responseContent = llmResponse.content();
        WhatsAppResponse waResponse = WhatsAppResponse.builder()
                .messageId(messageId)
                .nutritionistId(nutritionist.getId())
                .patientId(patient.getId())
                .responseType(responseType)
                .responseContent(responseContent)
                .build();
        whatsAppResponseRepository.save(waResponse);

        // 8. Send response via EvolutionApiService
        // Strip markdown JSON extraction blocks so the patient receives only friendly conversational text
        String textToSend = cleanMessageForWhatsApp(responseContent);

        boolean sent = evolutionApiService.sendMessage(
                message.getSenderPhoneNormalized(),
                textToSend
        );

        if (sent) {
            waResponse.setSentAt(LocalDateTime.now());
            whatsAppResponseRepository.save(waResponse);
        }

        // 9. Mark WhatsAppMessage as processed
        markProcessed(message);
        log.info("Message {} processed: intent={}, responseType={}, sent={}",
                messageId, llmResponse.intent(), responseType, sent);
    }

    /**
     * Check if this is the first message from this patient.
     * First message = no previously processed WhatsAppMessage with this patientId.
     */
    private boolean isFirstMessageFromPatient(UUID patientId) {
        // If no processed messages exist for this patient, this is the first interaction
        return !whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId);
    }

    /**
     * Build the greeting prompt for first-time interactions (D-17).
     */
    String buildGreetingPrompt(String patientName, String nutritionistName) {
        return """
            Você é um assistente de nutrição humana. O paciente {{patientName}} está enviando a primeira mensagem.
            Nutricionista: {{nutritionistName}}

            Gere uma saudação amigável, pontual e natural de WhatsApp como:
            "Oi {{patientName}}! Sou o assistente virtual da nutri {{nutritionistName}}. Tô aqui pra te acompanhar e tirar dúvidas do plano. Como você tá hoje?"

            Seja breve, acolhedor e direto (máximo 2 frases). Responda apenas com a mensagem de saudação.
            """.replace("{{patientName}}", escape(patientName))
               .replace("{{nutritionistName}}", escape(nutritionistName));
    }

    /**
     * Build acknowledgment prompt for audio/photo messages (D-05).
     */
    String buildAcknowledgmentPrompt(String tipo) {
        return """
            Você é um assistente de nutrição humana, empático e não julgador.

            Responda com um acknowledgment amigável, curto e natural de WhatsApp (1 a 2 frases). Exemplo:
            "Recebi seu áudio! Vou registrar o que você me contou."

            Seja breve e acolhedor. Responda apenas com a mensagem de acknowledgment.
            """.replace("{{tipo}}", escape(tipo));
    }

    /**
     * Build a classifying prompt that handles both meal extraction and plan questions (D-01, D-03).
     */
    String buildClassifyingPrompt(Patient patient, Nutritionist nutritionist, WhatsAppMessage message) {
        String patientContext = buildPatientContext(patient);
        String planContext = buildPlanContext(patient, nutritionist);
        String conversationContext = buildRecentConversationContext(
                patient, nutritionist, message != null ? message.getId() : null);

        String emotionalContext = "";
        if (message != null && (Boolean.TRUE.equals(message.getJevRequiresAttention())
                || "struggling".equalsIgnoreCase(message.getJevSentiment())
                || "guilty".equalsIgnoreCase(message.getJevSentiment())
                || "anxious".equalsIgnoreCase(message.getJevSentiment())
                || "guilty_or_struggling".equalsIgnoreCase(message.getJevSentiment()))) {
            emotionalContext = """

                ATENÇÃO CLÍNICA / SUPORTE EMOCIONAL:
                O paciente demonstra sinais de culpa, deslize alimentar ou queixa relevante.
                Seja especialmente caloroso, empático e encorajador. Acolha com compreensão sem julgar.
                Se for sintoma clínico ou dúvida complexa, informe com simpatia que a nutricionista foi notificada.
                """;
        }

        String substitutionContext = "";
        if (message != null && "substitution".equalsIgnoreCase(message.getJevIntent())) {
            substitutionContext = """

                ORIENTAÇÃO PARA SUBSTITUIÇÃO DE ALIMENTOS:
                O paciente está perguntando ou em dúvida sobre substituição de algum alimento do plano.
                Avalie com bom senso clínico se a troca pretendida é equilibrada em macronutrientes.
                Seja prático, incentive opções equivalentes e encoraje a continuidade da rotina sem neuras.
                """;
        }

        return """
            Você é um assistente de nutrição humana, empático e não julgador. Seu papel é auxiliar o paciente de forma amigável, pontual e orgânica pelo WhatsApp.

            REGRAS DE COMUNICAÇÃO (MUITO IMPORTANTE):
            - Seja PONTUAL, DIRETO e ORGÂNICO, como uma conversa real de WhatsApp.
            - Responda em no MÁXIMO 2 a 3 frases curtas e calorosas.
            - NUNCA envie textões, palestras explicativas ou lições de moral.
            - NUNCA use listas com marcadores (- ou •) ou tópicos, a menos que o paciente pergunte e peça sugestões.
            - NUNCA reprove o paciente por comer algo fora do plano.
            - Se o paciente relatou uma refeição: confirme o registro com simpatia e dê uma palavra rápida de incentivo (máximo 2 a 3 frases).
            - Se o paciente estiver complementando ou detalhando uma refeição já mencionada no histórico recente, consolide todos os alimentos da refeição no JSON e use o mesmo mealLabel.
            - Se o paciente perguntar sobre peso, emagrecimento, medidas ou evolução física: responda com base nos dados biométricos reais presentes no contexto do paciente de forma empática e motivadora.
            - Interprete pratos do dia a dia, gírias e lanches populares brasileiros (ex: 'x-frango', 'xfrango', 'x-tudo', 'x-salada', 'x-bacon' são sanduíches/lanches completos com pão, proteína e queijo; 'misto quente', 'pastel', 'coxinha', etc.). Se o paciente citar frações (ex: 'metade de um xfrango'), estime os macros proporcionais àquela fatia do sanduíche (pão + recheio).
            - Responda em português brasileiro.

            CONTEXTO DO PACIENTE:
            {{patientContext}}

            CONTEXTO COMPLETO DO PLANO ALIMENTAR:
            {{planContext}}
            {{conversationContext}}
            {{emotionalContext}}
            {{substitutionContext}}

            ESTRUTURA OBRIGATÓRIA DA SUA RESPOSTA:
            1. Escreva PRIMEIRO a mensagem amigável de WhatsApp destinada ao paciente (1 a 3 frases curtas e calorosas confirmando o registro).
            2. Logo abaixo, se o paciente relatou refeição(ões), inclua o bloco ```json com os dados nutricionais estimados:
            ```json
            {
              "meals": [
                {
                  "mealLabel": "almoço",
                  "items": [
                    {"name": "arroz integral", "grams": 150, "kcal": 170, "prot": 3.2, "carb": 35, "fat": 1.5},
                    {"name": "frango grelhado", "grams": 120, "kcal": 198, "prot": 25, "carb": 0, "fat": 10.5}
                  ]
                }
              ]
            }
            ```
            Se o paciente relatou mais de uma refeição na mesma mensagem (ex: café da manhã e almoço), inclua cada refeição como um item no array "meals".
            Se for apenas dúvida sobre o plano ou conversa geral, responda apenas a mensagem amigável (sem bloco ```json).
            """.replace("{{patientContext}}", escape(patientContext))
               .replace("{{planContext}}", escape(planContext))
               .replace("{{conversationContext}}", escape(conversationContext))
               .replace("{{emotionalContext}}", emotionalContext)
               .replace("{{substitutionContext}}", substitutionContext);
    }

    private boolean handleEmergencyEscalationIfTriggered(
            UUID messageId,
            WhatsAppMessage message,
            Patient patient,
            Nutritionist nutritionist
    ) {
        if (!shouldTriggerSafetyNotice(message)) {
            return false;
        }

        message.setJevRequiresAttention(true);
        message.setJevAttentionResolved(false);
        message.setJevAttentionScore(java.math.BigDecimal.ONE);
        whatsAppMessageRepository.save(message);

        String emergencyNotice = "Olá, " + patient.getName() + ". Notei seu relato de desconforto ou urgência. "
                + "Sua saúde é prioridade total! Notifiquei o(a) nutricionista " + nutritionist.getName()
                + " com alerta imediato. "
                + "Se você estiver sentindo dor forte ou mal-estar agudo, por favor procure um serviço de pronto "
                + "atendimento médico agora mesmo.";

        WhatsAppResponse waResponse = WhatsAppResponse.builder()
                .messageId(messageId)
                .nutritionistId(nutritionist.getId())
                .patientId(patient.getId())
                .responseType("EMERGENCY_ESCALATION")
                .responseContent(emergencyNotice)
                .build();
        whatsAppResponseRepository.save(waResponse);

        boolean sent = evolutionApiService.sendMessage(message.getSenderPhoneNormalized(), emergencyNotice);
        if (sent) {
            waResponse.setSentAt(LocalDateTime.now());
            whatsAppResponseRepository.save(waResponse);
        }
        markProcessed(message);
        log.warn("Emergency alert triggered via Jev triage for message {}", messageId);
        return true;
    }

    private boolean shouldTriggerSafetyNotice(WhatsAppMessage message) {
        if (message == null) return false;
        return "emergency".equalsIgnoreCase(message.getJevIntent());
    }

    private boolean shouldFastTrackGreeting(WhatsAppMessage message, String userMessage) {
        if (message == null || userMessage == null) {
            return false;
        }
        if (!"greeting".equalsIgnoreCase(message.getJevIntent())) {
            return false;
        }
        if (message.getJevIntentConfidence() == null || message.getJevIntentConfidence().doubleValue() < 0.80) {
            return false;
        }
        String lower = userMessage.toLowerCase().trim();
        if (lower.length() > 40) {
            return false;
        }
        if (lower.matches(".*\\b\\d+\\s*(g|gramas|kg|kcal)\\b.*")) {
            return false;
        }
        String[] foodKeywords = {
                "comi", "almocei", "jantei", "café", "cafe", "lanche",
                "arroz", "frango", "peso", "dieta",
                "troca", "substitui", "plano", "dor", "mal", "passando"
        };
        for (String kw : foodKeywords) {
            if (lower.contains(kw)) {
                return false;
            }
        }
        return true;
    }

    private void runJevTriageIfAvailable(WhatsAppMessage message, String userMessage) {
        if (jevService == null || !jevService.isAvailable() || userMessage == null || userMessage.isBlank()) {
            return;
        }
        try {
            JevDecision decision = jevService.analyzePatientMessage(userMessage);
            if (decision != null && decision.success()) {
                message.setJevIntent(decision.intent());
                message.setJevIntentConfidence(BigDecimal.valueOf(decision.intentConfidence()));
                message.setJevSentiment(decision.sentiment());
                message.setJevSentimentConfidence(BigDecimal.valueOf(decision.sentimentConfidence()));
                message.setJevAttentionScore(BigDecimal.valueOf(decision.attentionScore()));
                message.setJevRequiresAttention(decision.requiresHumanAttention());
                whatsAppMessageRepository.save(message);
                log.info("Jev triage for msg {}: intent={}, sentiment={}, attentionScore={}, reqHuman={}",
                        message.getId(), decision.intent(), decision.sentiment(),
                        decision.attentionScore(), decision.requiresHumanAttention());
            }
        } catch (Exception e) {
            log.warn("Jev AI triage error for message {}: {}", message.getId(), e.getMessage());
        }
    }

    /**
     * Build patient context for meal extraction prompts (D-03 - minimal context).
     */
    private String buildPatientContext(Patient patient) {
        StringBuilder sb = new StringBuilder();
        sb.append("Objetivo: ").append(patient.getObjective().getPortugueseLabel()).append("\n");

        // Add extras if available
        try {
            Optional<Episode> activeEpisode = episodeRepository
                    .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                            patient.getId(), patient.getNutritionistId());
            if (activeEpisode.isPresent()) {
                Optional<MealPlan> planOpt = mealPlanRepository
                        .findByEpisodeIdAndNutritionistId(activeEpisode.get().getId(), patient.getNutritionistId());
                if (planOpt.isPresent()) {
                    List<PlanExtra> extras = planExtraRepository.findByPlanIdOrderBySortOrder(planOpt.get().getId());
                    if (!extras.isEmpty()) {
                        sb.append("Extras permitidos: ");
                        extras.forEach(e -> sb.append(e.getName()).append(", "));
                        sb.setLength(sb.length() - 2); // remove trailing comma
                        sb.append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not load extras for patient {}: {}", patient.getId(), e.getMessage());
        }

        // Add biometry context if available
        try {
            if (biometryService != null && patient.getId() != null && patient.getNutritionistId() != null) {
                String biometryCtx = biometryService.getBiometryContextForWhatsApp(
                        patient.getId(), patient.getNutritionistId());
                if (biometryCtx != null && !biometryCtx.isBlank()) {
                    sb.append("\n").append(biometryCtx).append("\n");
                }
            }
        } catch (Exception e) {
            log.warn("Could not load biometry context for patient {}: {}", patient.getId(), e.getMessage());
        }

        return sb.toString();
    }

    /**
     * Build full plan context for plan question prompts (D-03 - full context).
     */
    private String buildPlanContext(Patient patient, Nutritionist nutritionist) {
        StringBuilder sb = new StringBuilder();

        try {
            Optional<Episode> activeEpisode = episodeRepository
                    .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                            patient.getId(), nutritionist.getId());
            if (activeEpisode.isEmpty()) {
                return "Nenhum plano alimentar ativo encontrado.";
            }

            Optional<MealPlan> planOpt = mealPlanRepository
                    .findByEpisodeIdAndNutritionistId(activeEpisode.get().getId(), nutritionist.getId());
            if (planOpt.isEmpty()) {
                return "Nenhum plano alimentar encontrado.";
            }

            MealPlan plan = planOpt.get();
            sb.append("Plano: ").append(plan.getTitle() != null ? plan.getTitle() : "Plano alimentar").append("\n");
            sb.append(String.format("Metas: %s kcal, %s g prot, %s g carb, %s g fat%n",
                    plan.getKcalTarget(), plan.getProtTarget(), plan.getCarbTarget(), plan.getFatTarget()));

            List<MealSlot> slots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(
                    plan.getId(), nutritionist.getId());
            for (MealSlot slot : slots) {
                sb.append(String.format("%n- %s (%s):%n", slot.getLabel(), slot.getTime()));
                List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
                for (MealOption option : options) {
                    sb.append(String.format("  %s:%n", option.getName()));
                    List<MealFood> foods = mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId());
                    for (MealFood food : foods) {
                        sb.append(String.format("    • %s (%s%s)%n",
                                food.getFoodName(),
                                food.getReferenceAmount(),
                                food.getUnit() != null ? food.getUnit() : "g"));
                    }
                    if (foods.isEmpty()) {
                        sb.append("    (vazio)\n");
                    }
                }
            }

            List<PlanExtra> extras = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId());
            if (!extras.isEmpty()) {
                sb.append("\nExtras permitidos:\n");
                extras.forEach(e -> sb.append(String.format("  • %s (%s)%n", e.getName(),
                        e.getQuantity() != null ? e.getQuantity() : "")));
            }

        } catch (Exception e) {
            log.warn("Could not build plan context for patient {}: {}", patient.getId(), e.getMessage());
            sb.append("Erro ao carregar plano alimentar.");
        }

        return sb.toString();
    }

    /**
     * Build a classifying prompt for image messages with caption (D-05).
     * Acknowledges the image while classifying the caption text.
     */
    String buildClassifyingPromptWithImageAck(Patient patient, Nutritionist nutritionist, WhatsAppMessage message) {
        String patientContext = buildPatientContext(patient);
        String planContext = buildPlanContext(patient, nutritionist);
        String conversationContext = buildRecentConversationContext(
                patient, nutritionist, message != null ? message.getId() : null);

        return """
            Você é um assistente de nutrição humana, empático e não julgador. Seu papel é auxiliar o paciente de forma amigável, pontual e orgânica pelo WhatsApp.

            REGRAS DE COMUNICAÇÃO (MUITO IMPORTANTE):
            - Seja PONTUAL, DIRETO e ORGÂNICO, como uma mensagem real de WhatsApp.
            - Responda em no MÁXIMO 2 frases curtas e calorosas.
            - NUNCA envie textões, palestras explicativas ou lições de moral.
            - NUNCA use listas com marcadores (- ou •) ou tópicos.
            - NUNCA reprove o paciente por comer algo fora do plano.
            - Confirme que recebeu a foto e o relato de forma leve e acolhedora.
            - Interprete lanches populares brasileiros (ex: 'x-frango', 'xfrango', 'x-salada', 'pastel', 'misto quente', etc.) considerando pão e recheio na estimativa.
            - Responda em português brasileiro.

            CONTEXTO DO PACIENTE:
            {{patientContext}}

            CONTEXTO COMPLETO DO PLANO ALIMENTAR:
            {{planContext}}
            {{conversationContext}}

            ESTRUTURA OBRIGATÓRIA DA SUA RESPOSTA:
            1. Escreva PRIMEIRO a mensagem amigável de WhatsApp destinada ao paciente (1 a 2 frases curtas e calorosas).
            2. Logo abaixo, inclua o bloco ```json com a extração dos alimentos mencionados na legenda:
            ```json
            {
              "meals": [
                {
                  "mealLabel": "almoço",
                  "items": [
                    {"name": "arroz integral", "grams": 150, "kcal": 170, "prot": 3.2, "carb": 35, "fat": 1.5}
                  ]
                }
              ]
            }
            ```
            """.replace("{{patientContext}}", escape(patientContext))
               .replace("{{planContext}}", escape(planContext))
               .replace("{{conversationContext}}", escape(conversationContext));
    }

    /**
     * Build a multimodal plate vision prompt comparing against patient's active plan.
     */
    String buildPlateVisionPrompt(Patient patient, Nutritionist nutritionist, WhatsAppMessage message) {
        String patientContext = buildPatientContext(patient);
        String planContext = buildPlanContext(patient, nutritionist);
        String conversationContext = buildRecentConversationContext(
                patient, nutritionist, message != null ? message.getId() : null);

        return """
            Você é um assistente de nutrição humana, empático e não julgador.
            Seu papel é auxiliar o paciente de forma amigável, pontual e orgânica pelo WhatsApp.

            REGRAS DE COMUNICAÇÃO (MUITO IMPORTANTE):
            - Seja PONTUAL, DIRETO e ORGÂNICO, como uma mensagem real de WhatsApp.
            - Responda em no MÁXIMO 2 frases curtas e calorosas (ex.: "Prato bonito! Almoço registrado com sucesso. Segue firme! 💪").
            - NUNCA envie textões, análises longas ou palestras explicativas.
            - NUNCA use listas com marcadores (- ou •) ou tópicos.
            - NUNCA reprove o paciente por comer algo fora do plano.
            - O paciente enviou uma FOTO da sua refeição / prato de comida.
            - Se o paciente já mencionou ou começou a relatar esta refeição nas mensagens recentes (veja o histórico recente), use essa informação para identificar os alimentos com máxima precisão, use o mesmo mealLabel (ex.: 'jantar', 'almoço') e consolide os alimentos no JSON.
            - Analise visualmente os alimentos no prato e estime as quantidades em gramas.
            - Responda em português brasileiro.

            CONTEXTO DO PACIENTE:
            {{patientContext}}

            CONTEXTO COMPLETO DO PLANO ALIMENTAR:
            {{planContext}}
            {{conversationContext}}

            ESTRUTURA OBRIGATÓRIA DA SUA RESPOSTA:
            1. Escreva PRIMEIRO a mensagem amigável de WhatsApp destinada ao paciente (1 a 2 frases curtas e calorosas).
            2. Logo abaixo, inclua o bloco ```json com a extração dos alimentos identificados na foto:
            ```json
            {
              "meals": [
                {
                  "mealLabel": "almoço",
                  "items": [
                    {"name": "arroz branco", "grams": 150, "kcal": 192, "prot": 3.7, "carb": 42.1, "fat": 0.3},
                    {"name": "frango grelhado", "grams": 120, "kcal": 191, "prot": 38.4, "carb": 0, "fat": 3.6}
                  ]
                }
              ]
            }
            ```
            """.replace("{{patientContext}}", escape(patientContext))
               .replace("{{planContext}}", escape(planContext))
               .replace("{{conversationContext}}", escape(conversationContext));
    }

    private String buildRecentConversationContext(Patient patient, Nutritionist nutritionist, UUID currentMessageId) {
        if (patient == null || patient.getId() == null || nutritionist == null || nutritionist.getId() == null) {
            return "";
        }
        try {
            List<WhatsAppMessage> recentMsgs = whatsAppMessageRepository
                    .findTop6ByPatientIdAndNutritionistIdOrderByCreatedAtDesc(patient.getId(), nutritionist.getId())
                    .stream()
                    .filter(m -> currentMessageId == null || !currentMessageId.equals(m.getId()))
                    .limit(5)
                    .sorted(java.util.Comparator.comparing(WhatsAppMessage::getCreatedAt))
                    .toList();

            if (recentMsgs.isEmpty()) {
                return "";
            }

            StringBuilder sb = new StringBuilder();
            sb.append("\nHISTÓRICO RECENTE DA CONVERSA:\n");
            for (WhatsAppMessage m : recentMsgs) {
                String content = m.getMessageContent();
                if (content == null || content.isBlank()) {
                    content = "[" + m.getMessageType() + "]";
                }
                sb.append("- Paciente: ").append(content).append("\n");

                List<WhatsAppResponse> responses = whatsAppResponseRepository
                        .findByMessageIdAndNutritionistId(m.getId(), nutritionist.getId());
                for (WhatsAppResponse r : responses) {
                    String cleaned = cleanMessageForWhatsApp(r.getResponseContent());
                    if (!cleaned.isBlank()) {
                        sb.append("- Compas: ").append(cleaned).append("\n");
                    }
                }
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Could not build conversation context for patient {}: {}", patient.getId(), e.getMessage());
            return "";
        }
    }

    private String escape(String input) {
        if (input == null) {
            return "";
        }
        // Replace curly braces to prevent accidental placeholder injection
        return input.replace("{", "\\{").replace("}", "\\}");
    }

    static String cleanMessageForWhatsApp(String content) {
        if (content == null || content.isBlank()) {
            return "Recebido! Já registrei suas informações aqui no plano. Vamos em frente! 💪";
        }

        // 1. Remove complete code blocks (```json ... ``` or ``` ... ```)
        String cleaned = content.replaceAll("(?s)```[a-zA-Z]*\\s*.*?```", "").trim();

        // 2. Remove unclosed code block (e.g. if response was truncated: ```json ...)
        cleaned = cleaned.replaceAll("(?s)```[a-zA-Z]*\\s*.*$", "").trim();

        // 3. Remove inline JSON objects with mealLabel, meals, or items
        cleaned = cleaned.replaceAll("(?s)\\{[^{}]*\"(mealLabel|meals|items)\"[^{}]*\\}", "").trim();

        // 4. If any unclosed '{' with JSON keys remains, strip from '{' onwards
        if (cleaned.contains("{") && (cleaned.contains("\"mealLabel\"") || cleaned.contains("\"meals\"") || cleaned.contains("\"items\""))) {
            cleaned = cleaned.substring(0, cleaned.indexOf('{')).trim();
        }

        // 5. If cleaned is blank or still contains JSON structure, use friendly fallback
        if (cleaned.isBlank() || isJsonSnippet(cleaned)) {
            return "Recebido! Já registrei sua refeição aqui no seu acompanhamento. Vamos em frente! 💪";
        }

        return cleaned;
    }

    private static boolean isJsonSnippet(String text) {
        String trimmed = text.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[")
                || trimmed.contains("\"meals\"") || trimmed.contains("\"mealLabel\"")
                || trimmed.contains("\"items\"");
    }

    private void markProcessed(WhatsAppMessage message) {
        message.setProcessed(true);
        message.setProcessedAt(LocalDateTime.now());
        whatsAppMessageRepository.save(message);
    }
}
