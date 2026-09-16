package com.nutriai.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.WebhookService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebhookControllerTest {

    @Mock WebhookService webhookService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String VALID_SECRET = "test-webhook-secret-123";

    @Test
    void receiveWebhook_secretNotConfigured_returns200() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, "");
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        verify(webhookService).processIncoming(any());
    }

    @Test
    void receiveWebhook_validPayload_returns200() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn(VALID_SECRET);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        verify(webhookService).processIncoming(any());
    }

    @Test
    void receiveWebhook_invalidPayload_returns400() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{invalid-json";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn(VALID_SECRET);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(400, response.getStatusCode().value());
        verify(webhookService, never()).processIncoming(any());
    }

    @Test
    void receiveWebhook_secretConfigured_unauthorizedWhenHeaderMissingOrWrong() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn("wrong-secret");
        when(request.getHeader("apikey")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(401, response.getStatusCode().value());
        verify(webhookService, never()).processIncoming(any());
    }

    @Test
    void receiveWebhook_secretConfigured_authorizedWithApikey() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn(null);
        when(request.getHeader("apikey")).thenReturn(VALID_SECRET);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        verify(webhookService).processIncoming(any());
    }

    @Test
    void receiveWebhook_secretConfigured_authorizedWithBearerToken() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{\"event\":\"Message\",\"data\":{\"info\":{\"sender\":\"5511999999999@s.whatsapp.net\",\"id\":\"msg-123\"}},\"instanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn(null);
        when(request.getHeader("apikey")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + VALID_SECRET);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        verify(webhookService).processIncoming(any());
    }

    @Test
    void receiveWebhook_evolutionGoPascalCase_returns200AndParsesCorrectly() {
        WebhookController controller = new WebhookController(webhookService, objectMapper, VALID_SECRET);
        String rawBody = "{\"Event\":\"Message\",\"Data\":{\"Info\":{\"Sender\":\"5511999999999@s.whatsapp.net\","
                + "\"ID\":\"msg-pascal-123\"},\"Message\":{\"ExtendedTextMessage\":{\"Text\":\"Oi nutri\"}}},"
                + "\"InstanceId\":\"inst-1\"}";
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Webhook-Secret")).thenReturn(VALID_SECRET);
        when(webhookService.processIncoming(any(WhatsAppWebhookDTO.class))).thenReturn(Optional.of(mock()));

        ResponseEntity<Void> response = controller.receiveWebhook(rawBody, request);

        assertEquals(200, response.getStatusCode().value());
        org.mockito.ArgumentCaptor<WhatsAppWebhookDTO> captor =
                org.mockito.ArgumentCaptor.forClass(WhatsAppWebhookDTO.class);
        verify(webhookService).processIncoming(captor.capture());
        WhatsAppWebhookDTO captured = captor.getValue();
        assertEquals("Message", captured.getEvent());
        assertNotNull(captured.getData());
        assertNotNull(captured.getData().getInfo());
        assertEquals("msg-pascal-123", captured.getData().getInfo().getId());
        assertEquals("5511999999999@s.whatsapp.net", captured.getData().getInfo().getSender());
        assertNotNull(captured.getData().getMessage());
        assertNotNull(captured.getData().getMessage().getExtendedTextMessage());
        assertEquals("Oi nutri", captured.getData().getMessage().getExtendedTextMessage().getText());
    }
}
