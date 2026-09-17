package com.nutriai.api.service;

import com.nutriai.api.dto.llm.ExtractionItemResult;
import com.nutriai.api.dto.llm.ExtractionResult;
import com.nutriai.api.dto.llm.LlmIntent;
import com.nutriai.api.dto.llm.LlmRequest;
import com.nutriai.api.dto.llm.LlmResponse;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;

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

        // Evolution message sent with cutoff text
        verify(evolutionApiService).sendMessage(
                eq(textMessage.getSenderPhoneNormalized()),
                argThat(text -> text.contains("pausado no momento") && text.contains("Dra. Maria"))
        );

        // Saved response with responseType PATIENT_INACTIVE
        verify(whatsAppResponseRepository, atLeastOnce()).save(argThat(resp ->
                "PATIENT_INACTIVE".equals(resp.getResponseType()) && resp.getSentAt() != null));

        // Message marked processed
        verify(whatsAppMessageRepository).save(argThat(msg -> Boolean.TRUE.equals(msg.getProcessed())));
    }
}
