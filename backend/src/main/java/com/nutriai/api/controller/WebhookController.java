package com.nutriai.api.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutriai.api.dto.whatsapp.WhatsAppWebhookDTO;
import com.nutriai.api.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Public webhook endpoint for Evolution Go WhatsApp callbacks.
 * No @PreAuthorize — external webhook callbacks do not carry user JWT.
 * Security:
 * 1. Webhook secret validation (fail-closed, constant-time header comparison).
 * 2. Message-level dedup by messageId + phone matching.
 */
@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
public class WebhookController {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookController.class);

    private final WebhookService webhookService;
    private final ObjectMapper objectMapper;
    private final String webhookSecret;

    public WebhookController(
            WebhookService webhookService,
            ObjectMapper objectMapper,
            @Value("${nutriai.webhook.secret:}") String webhookSecret) {
        this.webhookService = webhookService;
        this.objectMapper = objectMapper;
        this.webhookSecret = webhookSecret != null ? webhookSecret.trim() : "";
    }

    @PostMapping
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody String rawBody,
            HttpServletRequest request) {

        if (!isAuthorized(request)) {
            LOG.warn("Unauthorized WhatsApp webhook attempt from IP: {}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

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

    private boolean isAuthorized(HttpServletRequest request) {
        if (webhookSecret.isEmpty()) {
            LOG.warn("Webhook rejected: NUTRIAI_WEBHOOK_SECRET is not configured (fail-closed)");
            return false;
        }

        String xWebhookSecret = request.getHeader("X-Webhook-Secret");
        if (constantTimeEquals(webhookSecret, xWebhookSecret)) {
            return true;
        }

        String apikey = request.getHeader("apikey");
        if (constantTimeEquals(webhookSecret, apikey)) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null) {
            if (authHeader.startsWith("Bearer ")) {
                return constantTimeEquals(webhookSecret, authHeader.substring(7).trim());
            }
            return constantTimeEquals(webhookSecret, authHeader.trim());
        }

        return false;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
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
