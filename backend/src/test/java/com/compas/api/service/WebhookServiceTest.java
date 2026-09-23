package com.compas.api.service;

import com.compas.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.compas.api.model.Episode;
import com.compas.api.model.Patient;
import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppMessageRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebhookServiceTest {

    @Mock WhatsAppMessageRepository whatsAppMessageRepository;
    @Mock PatientRepository patientRepository;
    @Mock EpisodeRepository episodeRepository;
    @Mock PhoneNormalizationService phoneNormalizationService;
    @Mock MessageQueueService messageQueueService;
    @Mock EvolutionApiService evolutionApiService;
    @Mock com.compas.api.repository.WhatsAppInstanceRepository whatsAppInstanceRepository;

    @InjectMocks
    WebhookService webhookService;

    private UUID patientId;
    private UUID nutritionistId;
    private Patient patient;

    @BeforeEach
    void setup() {
        patientId = UUID.randomUUID();
        nutritionistId = UUID.randomUUID();
        patient = new Patient();
        patient.setId(patientId);
        patient.setNutritionistId(nutritionistId);
    }

    @Test
    void processIncoming_validTextMessage_savesAndEnqueues() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-123", "Oi, comi arroz e frango");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766")).thenReturn(List.of(nutritionistId));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId)).thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-123")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_unknownPhone_savesWithNullPatientAndMarkedProcessed() {
        WhatsAppWebhookDTO dto = createTextWebhook("55118888776655", "msg-456", "Oi");
        when(phoneNormalizationService.normalize("55118888776655")).thenReturn(Optional.of("118888776655"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("118888776655")).thenReturn(List.of());
        when(whatsAppMessageRepository.findByMessageId("msg-456")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(evolutionApiService).sendMessage(eq("118888776655"), anyString());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_unknownPhone_alreadyNotifiedRecently_debouncesNotice() {
        WhatsAppWebhookDTO dto = createTextWebhook("55118888776655", "msg-456-dup", "Oi novamente");
        when(phoneNormalizationService.normalize("55118888776655")).thenReturn(Optional.of("118888776655"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("118888776655")).thenReturn(List.of());
        when(whatsAppMessageRepository.findByMessageId("msg-456-dup")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.existsBySenderPhoneNormalizedAndPatientIdIsNullAndCreatedAtAfter(
                eq("118888776655"), any(LocalDateTime.class))).thenReturn(true);
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(evolutionApiService, never()).sendMessage(anyString(), anyString());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_duplicateMessageId_skipsProcessing() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-dup", "Oi");
        WhatsAppMessage existing = WhatsAppMessage.builder().messageId("msg-dup").build();
        when(whatsAppMessageRepository.findByMessageId("msg-dup")).thenReturn(Optional.of(existing));

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isEmpty());
        verify(whatsAppMessageRepository, never()).save(any());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_audioMessage_savesWithNullContentAndMediaUrl() {
        WhatsAppWebhookDTO dto = createAudioWebhook("55119999887766", "msg-audio", "https://media.url/audio.ogg");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-audio")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_imageMessageWithCaption_savesContentAndMediaUrl() {
        WhatsAppWebhookDTO dto = createImageWebhook(
                "55119999887766", "msg-img", "https://media.url/img.jpg", "Almoco: arroz e feijao");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-img")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_ambiguousPhoneAcrossNutritionists_marksProcessedWithoutEnqueue() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-amb", "Oi");
        Patient otherPatient = new Patient();
        otherPatient.setId(UUID.randomUUID());
        otherPatient.setNutritionistId(UUID.randomUUID());
        patient.setActive(false);
        otherPatient.setActive(false);

        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId, otherPatient.getNutritionistId()));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", otherPatient.getNutritionistId()))
                .thenReturn(Optional.of(otherPatient));
        when(whatsAppMessageRepository.findByMessageId("msg-amb")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_ambiguousPhone_resolvesToActiveEpisode() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-amb-active", "Oi");
        Patient otherPatient = new Patient();
        otherPatient.setId(UUID.randomUUID());
        otherPatient.setNutritionistId(UUID.randomUUID());
        otherPatient.setActive(false);

        patient.setActive(true);
        Episode episode = Episode.builder()
                .id(UUID.randomUUID())
                .patientId(patient.getId())
                .nutritionistId(nutritionistId)
                .startDate(LocalDateTime.now())
                .build();

        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId, otherPatient.getNutritionistId()));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", otherPatient.getNutritionistId()))
                .thenReturn(Optional.of(otherPatient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                patient.getId(), nutritionistId)).thenReturn(Optional.of(episode));
        when(whatsAppMessageRepository.findByMessageId("msg-amb-active")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_fromMeMessage_ignoresOwnMessages() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-own", "Oi");
        dto.getData().getInfo().setFromMe(true);
        // Should not reach normalization or repo queries

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isEmpty());
        verify(phoneNormalizationService, never()).normalize(any());
        verify(whatsAppMessageRepository, never()).save(any());
        verify(messageQueueService, never()).enqueue(any());
    }

    @Test
    void processIncoming_nonMessageEvent_ignores() {
        WhatsAppWebhookDTO dto = createTextWebhook("55119999887766", "msg-status", "Oi");
        dto.setEvent("Connected");

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isEmpty());
        verify(phoneNormalizationService, never()).normalize(any());
    }

    // Helpers

    private WhatsAppWebhookDTO createTextWebhook(String phone, String msgId, String text) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("Message");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.WhatsAppInfo info = new WhatsAppWebhookDTO.WhatsAppInfo();
        info.setSender(phone + "@s.whatsapp.net");
        info.setId(msgId);
        info.setFromMe(false);
        info.setType("text");
        data.setInfo(info);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        msg.setConversation(text);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    private WhatsAppWebhookDTO createAudioWebhook(String phone, String msgId, String url) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("Message");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.WhatsAppInfo info = new WhatsAppWebhookDTO.WhatsAppInfo();
        info.setSender(phone + "@s.whatsapp.net");
        info.setId(msgId);
        info.setFromMe(false);
        info.setType("media");
        info.setMediaType("audio");
        data.setInfo(info);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        WhatsAppWebhookDTO.AudioMessage audio = new WhatsAppWebhookDTO.AudioMessage();
        audio.setUrl(url);
        msg.setAudioMessage(audio);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    private WhatsAppWebhookDTO createImageWebhook(String phone, String msgId, String url, String caption) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("Message");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.WhatsAppInfo info = new WhatsAppWebhookDTO.WhatsAppInfo();
        info.setSender(phone + "@s.whatsapp.net");
        info.setId(msgId);
        info.setFromMe(false);
        info.setType("media");
        info.setMediaType("image");
        data.setInfo(info);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        WhatsAppWebhookDTO.ImageMessage img = new WhatsAppWebhookDTO.ImageMessage();
        img.setUrl(url);
        img.setCaption(caption);
        msg.setImageMessage(img);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    private WhatsAppWebhookDTO createExtendedTextWebhook(String phone, String msgId, String text) {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("Message");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.WhatsAppInfo info = new WhatsAppWebhookDTO.WhatsAppInfo();
        info.setSender(phone + "@s.whatsapp.net");
        info.setId(msgId);
        info.setFromMe(false);
        info.setType("text");
        data.setInfo(info);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        WhatsAppWebhookDTO.ExtendedTextMessage extMsg = new WhatsAppWebhookDTO.ExtendedTextMessage();
        extMsg.setText(text);
        msg.setExtendedTextMessage(extMsg);
        data.setMessage(msg);
        dto.setData(data);
        return dto;
    }

    @Test
    void processIncoming_extendedTextMessage_savesContentAndEnqueues() {
        WhatsAppWebhookDTO dto = createExtendedTextWebhook("55119999887766", "msg-ext", "Oi com extended text");
        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-ext")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }

    @Test
    void processIncoming_senderIsLid_resolvesPhoneFromChatOrSenderAlt() {
        WhatsAppWebhookDTO dto = new WhatsAppWebhookDTO();
        dto.setInstanceId("inst-1");
        dto.setEvent("Message");
        WhatsAppWebhookDTO.MessageData data = new WhatsAppWebhookDTO.MessageData();
        WhatsAppWebhookDTO.WhatsAppInfo info = new WhatsAppWebhookDTO.WhatsAppInfo();
        info.setSender("20504241016882@lid");
        info.setSenderAlt("55119999887766@s.whatsapp.net");
        info.setChat("55119999887766@s.whatsapp.net");
        info.setId("msg-lid-1");
        info.setFromMe(false);
        info.setType("text");
        data.setInfo(info);
        WhatsAppWebhookDTO.MessageContent msg = new WhatsAppWebhookDTO.MessageContent();
        msg.setConversation("Mensagem de LID");
        data.setMessage(msg);
        dto.setData(data);

        when(phoneNormalizationService.normalize("55119999887766")).thenReturn(Optional.of("119999887766"));
        when(patientRepository.findDistinctNutritionistIdsByWhatsapp("119999887766"))
                .thenReturn(List.of(nutritionistId));
        when(patientRepository.findByWhatsappAndNutritionistId("119999887766", nutritionistId))
                .thenReturn(Optional.of(patient));
        when(whatsAppMessageRepository.findByMessageId("msg-lid-1")).thenReturn(Optional.empty());
        when(whatsAppMessageRepository.save(any(WhatsAppMessage.class))).thenAnswer(i -> {
            WhatsAppMessage m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            return m;
        });

        Optional<?> result = webhookService.processIncoming(dto);

        assertTrue(result.isPresent());
        verify(messageQueueService).enqueue(any(UUID.class));
    }
}
