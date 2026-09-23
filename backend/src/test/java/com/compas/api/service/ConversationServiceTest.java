package com.compas.api.service;

import com.compas.api.dto.jev.JevDecision;
import com.compas.api.dto.llm.ExtractionItemResult;
import com.compas.api.dto.llm.ExtractionResult;
import com.compas.api.dto.llm.LlmIntent;
import com.compas.api.dto.llm.LlmRequest;
import com.compas.api.dto.llm.LlmResponse;
import com.compas.api.model.*;
import com.compas.api.repository.*;
import com.compas.api.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock LlmService llmService;
    @Mock ExtractionService extractionService;
    @Mock EvolutionApiService evolutionApiService;
    @Mock WhatsAppMessageRepository whatsAppMessageRepository;
    @Mock WhatsAppResponseRepository whatsAppResponseRepository;
    @Mock PatientRepository patientRepository;
    @Mock EpisodeRepository episodeRepository;
    @Mock MealPlanRepository mealPlanRepository;
    @Mock MealSlotRepository mealSlotRepository;
    @Mock MealOptionRepository mealOptionRepository;
    @Mock MealFoodRepository mealFoodRepository;
    @Mock PlanExtraRepository planExtraRepository;
    @Mock NutritionistRepository nutritionistRepository;
    @Mock AudioTranscriptionService audioTranscriptionService;
    @Mock JevService jevService;
    @Mock BiometryService biometryService;
    @Mock PatientDocumentService patientDocumentService;

    @InjectMocks
    ConversationService conversationService;

    private UUID messageId;
    private UUID patientId;
    private UUID nutritionistId;
    private UUID episodeId;
    private Patient patient;
    private Nutritionist nutritionist;
    private Episode activeEpisode;
    private WhatsAppMessage textMessage;
    private WhatsAppMessage audioMessage;
    private WhatsAppMessage imageMessage;

    @BeforeEach
    void setup() {
        conversationService.setPatientDocumentService(patientDocumentService);
        messageId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        nutritionistId = UUID.randomUUID();
        episodeId = UUID.randomUUID();

        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("João Silva")
                .objective(PatientObjective.EMAGRECIMENTO)
                .build();

        nutritionist = Nutritionist.builder()
                .id(nutritionistId)
                .name("Dra. Maria")
                .email("maria@example.com")
                .build();

        activeEpisode = Episode.builder()
                .id(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.now().minusDays(7))
                .build();

        textMessage = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("evolution-msg-1")
                .instanceId("inst-1")
                .senderPhone("5511999998888@s.whatsapp.net")
                .senderPhoneNormalized("11999998888")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageType("text")
                .messageContent("Comi arroz e frango no almoço")
                .processed(false)
                .createdAt(LocalDateTime.now())
                .build();

        audioMessage = WhatsAppMessage.builder()
                .id(UUID.randomUUID())
                .messageId("evolution-msg-audio")
                .instanceId("inst-1")
                .senderPhone("5511999998888@s.whatsapp.net")
                .senderPhoneNormalized("11999998888")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageType("audio")
                .mediaUrl("https://media.url/audio.ogg")
                .processed(false)
                .createdAt(LocalDateTime.now())
                .build();

        imageMessage = WhatsAppMessage.builder()
                .id(UUID.randomUUID())
                .messageId("evolution-msg-img")
                .instanceId("inst-1")
                .senderPhone("5511999998888@s.whatsapp.net")
                .senderPhoneNormalized("11999998888")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageType("image")
                .messageContent("Arroz, feijão e bife")
                .mediaUrl("https://media.url/img.jpg")
                .processed(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void processMessage_validMealReport_extractsAndSendsResponse() {
        ExtractionResult extraction = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("arroz", 150.0, 170, 3.2, 35, 1.5),
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
                .totalKcal(new BigDecimal("368"))
                .totalProt(new BigDecimal("28.2"))
                .totalCarb(new BigDecimal("35"))
                .totalFat(new BigDecimal("12"))
                .extractedAt(LocalDateTime.now())
                .build();

        LlmResponse llmResponse = new LlmResponse(
                "Que bom que você se alimentou! Registrei seu almoço.",
                LlmIntent.MEAL_REPORT,
                extraction,
                true,
                null
        );

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(extractionService.extractAndSave(eq(messageId), eq(patientId), eq(nutritionistId),
                eq(episodeId), eq(extraction))).thenReturn(savedExtraction);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(messageId);

        // Verify LLM was called
        verify(llmService).chat(any(LlmRequest.class));

        // Verify extraction was saved
        verify(extractionService).extractAndSave(eq(messageId), eq(patientId), eq(nutritionistId),
                eq(episodeId), eq(extraction));

        // Verify response was saved
        ArgumentCaptor<WhatsAppResponse> responseCaptor = ArgumentCaptor.forClass(WhatsAppResponse.class);
        verify(whatsAppResponseRepository, atLeastOnce()).save(responseCaptor.capture());

        // Verify Evolution API was called
        verify(evolutionApiService).sendMessage(eq("11999998888"), anyString());

        // Verify message was marked processed
        verify(whatsAppMessageRepository, atLeastOnce()).save(argThat(msg -> Boolean.TRUE.equals(msg.getProcessed())));
    }

    @Test
    void processMessage_planQuestion_respondsWithContext() {
        LlmResponse llmResponse = new LlmResponse(
                "Seu plano alimentar tem 6 refeições programadas.",
                LlmIntent.PLAN_QUESTION,
                null,
                true,
                null
        );

        when(whatsAppMessageRepository.findById(textMessage.getId())).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        // For plan context building
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(textMessage.getId());

        // Verify response was saved but no extraction
        verify(extractionService, never()).extractAndSave(any(), any(), any(), any(), any());

        // Verify Evolution API was called
        verify(evolutionApiService).sendMessage(eq("11999998888"), anyString());
    }

    @Test
    void processMessage_firstInteraction_sendsGreeting() {
        // First message from patient: existsByPatientIdAndProcessedTrue returns false
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(false);

        LlmResponse greetingResponse = new LlmResponse(
                "Oi João! Sou o assistente virtual da nutri Dra. Maria.",
                LlmIntent.GREETING,
                null,
                true,
                null
        );
        when(llmService.chat(any(LlmRequest.class))).thenReturn(greetingResponse);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // Verify greeting prompt was used (contains patient name and nutritionist name)
        ArgumentCaptor<LlmRequest> requestCaptor = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmService).chat(requestCaptor.capture());
        assertTrue(requestCaptor.getValue().systemPrompt().contains("João"));
        assertTrue(requestCaptor.getValue().systemPrompt().contains("Dra. Maria"));

        // Verify response type is GREETING
        ArgumentCaptor<WhatsAppResponse> responseCaptor = ArgumentCaptor.forClass(WhatsAppResponse.class);
        verify(whatsAppResponseRepository, atLeastOnce()).save(responseCaptor.capture());
        List<WhatsAppResponse> allResponses = responseCaptor.getAllValues();
        assertTrue(allResponses.stream().anyMatch(r -> "GREETING".equals(r.getResponseType())));
    }

    @Test
    void processMessage_audioMessage_sendsAcknowledgment() {
        when(whatsAppMessageRepository.findById(audioMessage.getId())).thenReturn(Optional.of(audioMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        LlmResponse ackResponse = new LlmResponse(
                "Recebi seu áudio! Vou registrar o que você me contou.",
                LlmIntent.MISCELLANEOUS,
                null,
                true,
                null
        );
        when(llmService.chat(any(LlmRequest.class))).thenReturn(ackResponse);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(audioMessage.getId());

        // Verify acknowledgment prompt was used
        ArgumentCaptor<LlmRequest> requestCaptor = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmService).chat(requestCaptor.capture());
        assertTrue(requestCaptor.getValue().systemPrompt().contains("áudio"));

        // Verify response type is ACKNOWLEDGMENT
        ArgumentCaptor<WhatsAppResponse> responseCaptor = ArgumentCaptor.forClass(WhatsAppResponse.class);
        verify(whatsAppResponseRepository, atLeastOnce()).save(responseCaptor.capture());
        List<WhatsAppResponse> allResponses = responseCaptor.getAllValues();
        assertTrue(allResponses.stream().anyMatch(r -> "ACKNOWLEDGMENT".equals(r.getResponseType())));
    }

    @Test
    void processMessage_imageMessageWithCaption_extractsFromCaption() {
        when(whatsAppMessageRepository.findById(imageMessage.getId())).thenReturn(Optional.of(imageMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        ExtractionResult extraction = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("arroz", 150.0, 170, 3.2, 35, 1.5),
                        new ExtractionItemResult("feijão", 80.0, 77, 5, 14, 0.5),
                        new ExtractionItemResult("bife", 120.0, 198, 25, 0, 10.5)
                ),
                "Arroz, feijão e bife"
        );

        LlmResponse llmResponse = new LlmResponse(
                " registrei seu almoço.",
                LlmIntent.MEAL_REPORT,
                extraction,
                true,
                null
        );

        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(extractionService.extractAndSave(any(), eq(patientId), eq(nutritionistId),
                eq(episodeId), any())).thenReturn(MealExtraction.builder().id(UUID.randomUUID()).build());
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(imageMessage.getId());

        verify(extractionService).extractAndSave(any(), eq(patientId), eq(nutritionistId),
                eq(episodeId), any());
        verify(evolutionApiService).sendMessage(anyString(), anyString());
    }

    @Test
    void processMessage_audioMessage_transcribesAndProcessesMealReport() {
        when(whatsAppMessageRepository.findById(audioMessage.getId())).thenReturn(Optional.of(audioMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        byte[] fakeAudio = new byte[]{1, 2, 3, 4};
        when(evolutionApiService.downloadMedia("https://media.url/audio.ogg")).thenReturn(Optional.of(fakeAudio));
        when(audioTranscriptionService.transcribe(fakeAudio, "audio.ogg"))
                .thenReturn(Optional.of("Almocei frango grelhado e salada"));

        ExtractionResult extraction = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("frango grelhado", 150.0, 240, 40, 0, 8),
                        new ExtractionItemResult("salada", 100.0, 30, 1, 5, 0.5)
                ),
                "Almocei frango grelhado e salada"
        );
        LlmResponse llmResponse = new LlmResponse(
                "Excelente escolha no almoço! Proteínas ótimas.",
                LlmIntent.MEAL_REPORT,
                extraction,
                true,
                null
        );
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(extractionService.extractAndSave(any(), eq(patientId), eq(nutritionistId),
                eq(episodeId), any())).thenReturn(MealExtraction.builder().id(UUID.randomUUID()).build());
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(audioMessage.getId());

        assertEquals("Almocei frango grelhado e salada", audioMessage.getMessageContent());
        verify(audioTranscriptionService).transcribe(fakeAudio, "audio.ogg");
        verify(extractionService).extractAndSave(any(), eq(patientId), eq(nutritionistId), eq(episodeId), any());
        verify(evolutionApiService).sendMessage(eq("11999998888"), anyString());
    }

    @Test
    void processMessage_audioMessage_transcriptionFails_fallsBackToAcknowledgment() {
        when(whatsAppMessageRepository.findById(audioMessage.getId())).thenReturn(Optional.of(audioMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(evolutionApiService.downloadMedia("https://media.url/audio.ogg")).thenReturn(Optional.of(new byte[]{1}));
        when(audioTranscriptionService.transcribe(any(byte[].class), eq("audio.ogg")))
                .thenReturn(Optional.empty());

        LlmResponse ackResponse = new LlmResponse(
                "Recebi seu áudio! Vou registrar o que você me contou.",
                LlmIntent.MISCELLANEOUS,
                null,
                true,
                null
        );
        when(llmService.chat(any(LlmRequest.class))).thenReturn(ackResponse);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(audioMessage.getId());

        ArgumentCaptor<LlmRequest> captor = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmService).chat(captor.capture());
        assertTrue(captor.getValue().systemPrompt().contains("áudio"));
        verify(extractionService, never()).extractAndSave(any(), any(), any(), any(), any());
    }

    @Test
    void processMessage_imageMessage_analyzesPlateWithVisionAndExtractsMeal() {
        WhatsAppMessage plateMsg = WhatsAppMessage.builder()
                .id(UUID.randomUUID())
                .messageId("msg-plate-vision")
                .instanceId("inst-1")
                .senderPhone("5511999998888@s.whatsapp.net")
                .senderPhoneNormalized("11999998888")
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .messageType("image")
                .mediaUrl("https://media.url/plate.jpg")
                .processed(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(whatsAppMessageRepository.findById(plateMsg.getId())).thenReturn(Optional.of(plateMsg));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(evolutionApiService.getMediaAsBase64DataUri("https://media.url/plate.jpg", "image/jpeg"))
                .thenReturn(Optional.of("data:image/jpeg;base64,mockImageData123"));

        ExtractionResult extraction = new ExtractionResult(
                "almoço",
                List.of(
                        new ExtractionItemResult("arroz branco", 150.0, 192, 3.7, 42.1, 0.3),
                        new ExtractionItemResult("frango grelhado", 120.0, 191, 38.4, 0.0, 3.6)
                ),
                "Foto da refeição enviada pelo paciente"
        );
        LlmResponse llmResponse = new LlmResponse(
                "Prato muito equilibrado! Ótima quantidade de proteínas.",
                LlmIntent.MEAL_REPORT,
                extraction,
                true,
                null
        );
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(extractionService.extractAndSave(any(), eq(patientId), eq(nutritionistId),
                eq(episodeId), any())).thenReturn(MealExtraction.builder().id(UUID.randomUUID()).build());
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(plateMsg.getId());

        ArgumentCaptor<LlmRequest> captor = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmService).chat(captor.capture());
        assertEquals("data:image/jpeg;base64,mockImageData123", captor.getValue().imageUrl());
        assertTrue(captor.getValue().systemPrompt().contains("prato de comida"));
        verify(extractionService).extractAndSave(any(), eq(patientId), eq(nutritionistId), eq(episodeId), any());
        verify(evolutionApiService).sendMessage(eq("11999998888"), anyString());
    }

    @Test
    void processMessage_unknownPatient_skipsProcessing() {
        WhatsAppMessage unknownMsg = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("evolution-msg-unk")
                .instanceId("inst-1")
                .senderPhone("5511877665544@s.whatsapp.net")
                .senderPhoneNormalized("1187766554")
                .patientId(null)  // Unknown sender
                .nutritionistId(null)
                .messageType("text")
                .messageContent("Oi")
                .processed(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(unknownMsg));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // No LLM call, no extraction, no evolution send
        verify(llmService, never()).chat(any());
        verify(extractionService, never()).extractAndSave(any(), any(), any(), any(), any());
        verify(evolutionApiService, never()).sendMessage(anyString(), anyString());
        verify(whatsAppMessageRepository).save(argThat(msg -> msg.getProcessed()));
    }

    @Test
    void processMessage_llmFailure_sendsNoResponseAndLogs() {
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        LlmResponse failedResponse = LlmResponse.failed("LLM API timeout after 30s");
        when(llmService.chat(any(LlmRequest.class))).thenReturn(failedResponse);

        conversationService.processMessage(messageId);

        // No response saved, no evolution send, message NOT marked processed
        verify(whatsAppResponseRepository, never()).save(any());
        verify(evolutionApiService, never()).sendMessage(anyString(), anyString());
        // Message stays unprocessed for retry — not saved with processed=true
        verify(whatsAppMessageRepository, never()).save(argThat(msg -> Boolean.TRUE.equals(msg.getProcessed())));
    }

    @Test
    void processMessage_inactivePatient_sendsPausedMessageAndSkipsLlm() {
        patient.setActive(false);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // No LLM call, no extraction
        verify(llmService, never()).chat(any());
        verify(extractionService, never()).extractAndSave(any(), any(), any(), any(), any());

        // Evolution message sent with direct contact text
        verify(evolutionApiService).sendMessage(
                eq(textMessage.getSenderPhoneNormalized()),
                argThat(text -> text.contains("entre em contato diretamente") && text.contains("Dra. Maria"))
        );

        // Saved response with responseType PATIENT_INACTIVE
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(resp ->
                "PATIENT_INACTIVE".equals(resp.getResponseType()) && resp.getSentAt() != null));

        // Message marked processed
        verify(whatsAppMessageRepository).save(argThat(msg -> Boolean.TRUE.equals(msg.getProcessed())));
    }

    @Test
    void cleanMessageForWhatsApp_truncatedJson_returnsFriendlyFallback() {
        String truncated = "```json\n{\n  \"meals\": [\n    {\n      \"mealLabel\": \"café\",\n      \"items\": [";
        String cleaned = ConversationService.cleanMessageForWhatsApp(truncated);
        assertFalse(cleaned.contains("```"));
        assertFalse(cleaned.contains("mealLabel"));
        assertTrue(cleaned.contains("Recebido!"));
    }

    @Test
    void cleanMessageForWhatsApp_textBeforeJson_returnsOnlyText() {
        String content = "Tudo anotado! Já registrei seu café da manhã e almoço.\n```json\n{\n  \"meals\": []\n}\n```";
        String cleaned = ConversationService.cleanMessageForWhatsApp(content);
        assertEquals("Tudo anotado! Já registrei seu café da manhã e almoço.", cleaned);
    }

    @Test
    void cleanMessageForWhatsApp_rawJsonOnly_returnsFriendlyFallback() {
        String content = "{\"mealLabel\": \"almoço\", \"items\": []}";
        String cleaned = ConversationService.cleanMessageForWhatsApp(content);
        assertFalse(cleaned.contains("{"));
        assertFalse(cleaned.contains("mealLabel"));
        assertTrue(cleaned.contains("Recebido!"));
    }

    @Test
    void processMessage_multiMealReport_extractsAndSavesAllMeals() {
        ExtractionResult breakfast = new ExtractionResult("café da manhã",
                List.of(new ExtractionItemResult("ovos", 150.0, 150, 12, 1, 10)), "raw");
        ExtractionResult lunch = new ExtractionResult("almoço",
                List.of(new ExtractionItemResult("arroz", 100.0, 130, 2, 28, 1)), "raw");
        ExtractionResult multiMeal = new ExtractionResult("café da manhã",
                List.of(), "raw", List.of(breakfast, lunch));

        LlmResponse llmResponse = new LlmResponse(
                "Tudo certo! Registrei seu café e almoço.\n```json\n{}\n```",
                LlmIntent.MEAL_REPORT,
                multiMeal,
                true,
                null
        );

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patientId, nutritionistId)).thenReturn(Optional.of(activeEpisode));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty());

        conversationService.processMessage(messageId);

        // Verify both meals were saved
        verify(extractionService).extractAndSave(eq(messageId), eq(patientId), eq(nutritionistId),
                eq(episodeId), eq(breakfast));
        verify(extractionService).extractAndSave(eq(messageId), eq(patientId), eq(nutritionistId),
                eq(episodeId), eq(lunch));

        // Verify WhatsApp message sent was friendly text without JSON
        verify(evolutionApiService).sendMessage(eq("11999998888"),
                eq("Tudo certo! Registrei seu café e almoço."));
    }

    @Test
    void processMessage_withJevAvailable_performsTriageAndSavesToMessage() {
        conversationService.setJevService(jevService);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.analyzePatientMessage(anyString())).thenReturn(
                new JevDecision("emotional_slip", 0.92, "guilty_or_struggling", 0.88, 0.85, true, true, "jev-1.13.0")
        );

        LlmResponse llmResponse = new LlmResponse(
                "Te entendo perfeitamente, não se culpe!", LlmIntent.MISCELLANEOUS, null, true, null);
        when(llmService.chat(any(LlmRequest.class))).thenReturn(llmResponse);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        verify(jevService).analyzePatientMessage(eq(textMessage.getMessageContent()));
        assertEquals("emotional_slip", textMessage.getJevIntent());
        assertEquals("guilty_or_struggling", textMessage.getJevSentiment());
        assertTrue(textMessage.getJevRequiresAttention());
    }

    @Test
    void processMessage_greetingFastTrack_bypassesLlmAndRespondsImmediately() {
        conversationService.setJevService(jevService);
        textMessage.setMessageContent("Olá bom dia!");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.analyzePatientMessage(anyString())).thenReturn(
                new JevDecision("greeting", 0.95, "neutral", 0.90, 0.10, false, true, "jev-1.13.0")
        );

        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // Verify LLM was NOT called
        verify(llmService, never()).chat(any());
        // Verify greeting was sent
        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("Olá, João Silva!"));
        assertTrue(textMessage.getProcessed());
    }

    @Test
    void processMessage_emergencyIntent_triggersSafetyNoticeWithoutLlm() {
        conversationService.setJevService(jevService);
        textMessage.setMessageContent("Estou sentindo muita dor e falta de ar");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.analyzePatientMessage(anyString())).thenReturn(
                new JevDecision("emergency", 0.98, "urgent_distress", 0.95, 0.99, true, true, "jev-1.13.0")
        );

        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // Verify LLM was NOT called
        verify(llmService, never()).chat(any());
        // Verify emergency notice sent
        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("pronto atendimento"));
        assertTrue(textMessage.getProcessed());
    }

    @Test
    void buildClassifyingPrompt_includesBiometryContext_whenBiometryServiceAvailable() {
        conversationService.setBiometryService(biometryService);
        when(biometryService.getBiometryContextForWhatsApp(patient.getId(), nutritionist.getId()))
                .thenReturn("EVOLUÇÃO BIOMÉTRICA: - Peso inicial 85kg -> atual 80kg");

        String prompt = conversationService.buildClassifyingPrompt(patient, nutritionist, textMessage);

        assertNotNull(prompt);
        assertTrue(prompt.contains("EVOLUÇÃO BIOMÉTRICA: - Peso inicial 85kg -> atual 80kg"));
        assertTrue(prompt.contains("Se o paciente perguntar sobre peso, emagrecimento"));
    }

    @Test
    void processMessage_nutritionistSubscriptionInactive_sendsFriendlyPauseNoticeAndSkipsLlm() {
        nutritionist.setSubscriptionTier("TRIAL");
        nutritionist.setTrialEndsAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        // Verify LLM was NOT called
        verify(llmService, never()).chat(any());
        // Verify friendly paused notice sent via Evolution API
        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("atendimento da assistente virtual do consultório está temporariamente pausado"));
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(r -> "SUBSCRIPTION_INACTIVE".equals(r.getResponseType())));
        assertTrue(textMessage.getProcessed());
    }

    @Test
    void processMessage_nutritionistSubscriptionInactive_deliveryFails_doesNotMarkProcessed() {
        nutritionist.setSubscriptionTier("TRIAL");
        nutritionist.setTrialEndsAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(false);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        assertFalse(textMessage.getProcessed());
    }

    @Test
    void processMessage_llmFailureOnLastRetry_sendsResilientTechnicalFallback() {
        textMessage.setRetryCount(MessageProcessorWorker.MAX_RETRIES - 1);

        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(llmService.chat(any(LlmRequest.class))).thenReturn(LlmResponse.failed("Timeout"));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("oscilação na conexão"));
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(r -> "TECHNICAL_FALLBACK".equals(r.getResponseType())));
        assertTrue(textMessage.getProcessed());
    }

    @Test
    void sendTechnicalFallback_byId_sendsFriendlyMessageAndMarksProcessed() {
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.sendTechnicalFallback(messageId);

        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("oscilação na conexão"));
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(r -> "TECHNICAL_FALLBACK".equals(r.getResponseType())));
        assertTrue(textMessage.getProcessed());
    }

    @Test
    void sendTechnicalFallback_deliveryFails_doesNotMarkProcessed() {
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(false);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.sendTechnicalFallback(messageId);

        assertFalse(textMessage.getProcessed());
    }

    @Test
    void processMessage_whenPatientRequestsMealPlanPdf_generatesAndDeliversPdf() {
        textMessage.setMessageContent("Pode me mandar o PDF do meu plano alimentar?");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        byte[] fakePdf = new byte[]{1, 2, 3};
        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId)).thenReturn(fakePdf);
        when(evolutionApiService.sendMediaDocument(anyString(), any(), anyString(), anyString())).thenReturn(true);

        conversationService.processMessage(messageId);

        verify(patientDocumentService).generateMealPlanPdf(nutritionistId, patientId);
        verify(evolutionApiService).sendMediaDocument(
                eq("11999998888"),
                eq(fakePdf),
                contains("Plano_Alimentar"),
                contains("plano alimentar")
        );
        assertTrue(textMessage.getProcessed());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenPatientRequestsGroceryListPdf_generatesAndDeliversGroceryList() {
        textMessage.setMessageContent("Manda a lista de compras em pdf por favor");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        byte[] fakePdf = new byte[]{4, 5, 6};
        when(patientDocumentService.generateGroceryListPdf(nutritionistId, patientId)).thenReturn(fakePdf);
        when(evolutionApiService.sendMediaDocument(anyString(), any(), anyString(), anyString())).thenReturn(true);

        conversationService.processMessage(messageId);

        verify(patientDocumentService).generateGroceryListPdf(nutritionistId, patientId);
        verify(evolutionApiService).sendMediaDocument(
                eq("11999998888"),
                eq(fakePdf),
                contains("Lista_de_Compras"),
                contains("lista de compras")
        );
        assertTrue(textMessage.getProcessed());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenPatientRequestsBiometryReportPdf_generatesAndDeliversBiometryReport() {
        textMessage.setMessageContent("Quero meu relatório de evolução corporal em pdf");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        byte[] fakePdf = new byte[]{7, 8, 9};
        when(patientDocumentService.generateBiometryReportPdf(nutritionistId, patientId)).thenReturn(fakePdf);
        when(evolutionApiService.sendMediaDocument(anyString(), any(), anyString(), anyString())).thenReturn(true);

        conversationService.processMessage(messageId);

        verify(patientDocumentService).generateBiometryReportPdf(nutritionistId, patientId);
        verify(evolutionApiService).sendMediaDocument(
                eq("11999998888"),
                eq(fakePdf),
                contains("Relatorio_Evolucao"),
                contains("relatório de evolução")
        );
        assertTrue(textMessage.getProcessed());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenPatientRequestsPdfButNoPlanExists_sendsPoliteFallbackMessage() {
        textMessage.setMessageContent("Pode enviar meu plano em pdf?");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId))
                .thenThrow(new IllegalStateException("Nenhum plano alimentar encontrado"));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);

        conversationService.processMessage(messageId);

        verify(evolutionApiService).sendMessage(
                eq("11999998888"),
                contains("Ainda não encontrei um plano alimentar ativo")
        );
        assertTrue(textMessage.getProcessed());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenResourceNotFoundOccursDuringDocumentRequest_sendsPoliteUnavailableMessage() {
        textMessage.setMessageContent("Pode enviar meu plano em pdf?");
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId))
                .thenThrow(new ResourceNotFoundException("Plano alimentar", patientId));
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);

        conversationService.processMessage(messageId);

        verify(evolutionApiService).sendMessage(
                eq("11999998888"),
                contains("Ainda não encontrei um plano alimentar ativo")
        );
        assertTrue(textMessage.getProcessed());
        verify(whatsAppResponseRepository).save(argThat(r -> "DOCUMENT_UNAVAILABLE".equals(r.getResponseType())));
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenSendMediaDocumentFailsAndRetriesRemain_leavesMessageUnprocessed() {
        textMessage.setMessageContent("Manda meu plano em pdf");
        textMessage.setRetryCount(0);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId)).thenReturn(new byte[]{1, 2, 3});
        when(evolutionApiService.sendMediaDocument(anyString(), any(), anyString(), anyString())).thenReturn(false);

        conversationService.processMessage(messageId);

        assertFalse(textMessage.getProcessed());
        verify(whatsAppResponseRepository, never()).save(any());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenSendMediaDocumentFailsAndRetriesExhausted_sendsTechnicalFallback() {
        textMessage.setMessageContent("Manda meu plano em pdf");
        textMessage.setRetryCount(MessageProcessorWorker.MAX_RETRIES - 1);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId)).thenReturn(new byte[]{1, 2, 3});
        when(evolutionApiService.sendMediaDocument(anyString(), any(), anyString(), anyString())).thenReturn(false);
        when(evolutionApiService.sendMessage(anyString(), anyString())).thenReturn(true);
        when(whatsAppResponseRepository.save(any(WhatsAppResponse.class))).thenAnswer(i -> i.getArgument(0));

        conversationService.processMessage(messageId);

        verify(evolutionApiService).sendMessage(eq("11999998888"), contains("oscilação na conexão"));
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(r -> "TECHNICAL_FALLBACK".equals(r.getResponseType())));
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_whenUnexpectedExceptionOccursDuringDocumentGeneration_doesNotSendMissingPlanMessage() {
        textMessage.setMessageContent("Manda meu plano em pdf");
        textMessage.setRetryCount(0);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId))
                .thenThrow(new RuntimeException("Database connection timeout"));

        conversationService.processMessage(messageId);

        assertFalse(textMessage.getProcessed());
        verify(evolutionApiService, never()).sendMessage(anyString(), anyString());
        verify(whatsAppResponseRepository, never()).save(any());
        verifyNoInteractions(llmService);
    }

    @Test
    void processMessage_when5xxResponseStatusExceptionOccurs_doesNotSendMissingDataMessage() {
        textMessage.setMessageContent("Manda meu plano em pdf");
        textMessage.setRetryCount(0);
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(textMessage));
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(whatsAppMessageRepository.existsByPatientIdAndProcessedTrue(patientId)).thenReturn(true);

        when(patientDocumentService.generateMealPlanPdf(nutritionistId, patientId))
                .thenThrow(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF service unavailable"));

        conversationService.processMessage(messageId);

        assertFalse(textMessage.getProcessed());
        verify(evolutionApiService, never()).sendMessage(anyString(), anyString());
        verify(whatsAppResponseRepository, never()).save(any());
        verifyNoInteractions(llmService);
    }

    @Test
    void detectDocumentRequest_identifiesCorrectTypesAndIgnoresGeneralInquiries() {
        assertEquals(ConversationService.RequestedDocumentType.MEAL_PLAN,
                conversationService.detectDocumentRequest("Manda meu plano em pdf"));
        assertEquals(ConversationService.RequestedDocumentType.MEAL_PLAN,
                conversationService.detectDocumentRequest("Pode me enviar o cardápio?"));
        assertEquals(ConversationService.RequestedDocumentType.GROCERY_LIST,
                conversationService.detectDocumentRequest("Lista de compras da semana em pdf"));
        assertEquals(ConversationService.RequestedDocumentType.BIOMETRY_REPORT,
                conversationService.detectDocumentRequest("Relatório de evolução em pdf"));

        // Conversational/status queries that should NOT trigger document delivery
        assertNull(conversationService.detectDocumentRequest("Quero começar uma nova dieta"));
        assertNull(conversationService.detectDocumentRequest("Preciso mudar minha dieta"));
        assertNull(conversationService.detectDocumentRequest("Como está meu progresso?"));
        assertNull(conversationService.detectDocumentRequest("Minha evolução tá boa?"));
        assertNull(conversationService.detectDocumentRequest("Posso comer banana no café da manhã?"));
        assertNull(conversationService.detectDocumentRequest("Almocei arroz com frango e salada"));
    }
}
