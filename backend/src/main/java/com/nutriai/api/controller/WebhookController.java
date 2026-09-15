package com.nutriai.api.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public webhook endpoint for Evolution Go WhatsApp callbacks.
 * No @PreAuthorize — no auth required by Evolution Go (no HMAC).
 * Security is message-level: dedup by messageId + phone matching.
 */
@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
public class WebhookController {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookController.class);

    private final WebhookService webhookService;
    private final ObjectMapper objectMapper;

    public WebhookController(WebhookService webhookService, ObjectMapper objectMapper) {
        this.webhookService = webhookService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody String rawBody,
            HttpServletRequest request) {

        WhatsAppWebhookDTO payload = parsePayload(rawBody);
        if (payload == null) {
            LOG.warn("Invalid webhook payload from {}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Process the webhook
        webhookService.processIncoming(payload);

        // Return 200 immediately — processing is async
        return ResponseEntity.ok().build();
    }

    private WhatsAppWebhookDTO parsePayload(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, WhatsAppWebhookDTO.class);
        } catch (JsonProcessingException e) {
            LOG.debug("Failed to deserialize WhatsApp webhook payload", e);
            return null;
        }
    }
}
