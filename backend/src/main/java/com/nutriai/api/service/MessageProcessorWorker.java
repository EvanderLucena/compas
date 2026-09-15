package com.nutriai.api.service;

import com.nutriai.api.model.WhatsAppMessage;
import com.nutriai.api.repository.WhatsAppMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Async queue worker that processes enqueued messages.
 * Polls Redis every 2 seconds and delegates to ConversationService.
 * Retries failed messages up to 3 times (D-09 + WR-05).
 */
@Component
public class MessageProcessorWorker {

    private static final Logger log = LoggerFactory.getLogger(MessageProcessorWorker.class);
    private static final int MAX_RETRIES = 3;

    private final MessageQueueService messageQueueService;
    private final ConversationService conversationService;
    private final WhatsAppMessageRepository whatsAppMessageRepository;

    public MessageProcessorWorker(
            MessageQueueService messageQueueService,
            ConversationService conversationService,
            WhatsAppMessageRepository whatsAppMessageRepository) {
        this.messageQueueService = messageQueueService;
        this.conversationService = conversationService;
        this.whatsAppMessageRepository = whatsAppMessageRepository;
    }

    /**
     * Poll Redis and process the next message.
     * Runs every 2 seconds via Spring @Scheduled.
     */
    @Scheduled(fixedDelay = 2000)
    public void processNextMessage() {
        Optional<UUID> messageIdOpt = messageQueueService.dequeue();
        if (messageIdOpt.isEmpty()) {
            return;
        }

        UUID messageId = messageIdOpt.get();
        Optional<WhatsAppMessage> msgOpt = whatsAppMessageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            msgOpt = whatsAppMessageRepository.findById(messageId);
            if (msgOpt.isEmpty()) {
                log.warn("Message {} not found in DB, dropping from queue", messageId);
                return;
            }
        }

        WhatsAppMessage message = msgOpt.get();

        // Guard against double-processing (requeueFailedMessages may have re-enqueued)
        if (Boolean.TRUE.equals(message.getProcessed())) {
            log.debug("Message {} already processed, skipping", messageId);
            return;
        }

        if (message.getRetryCount() >= MAX_RETRIES) {
            log.warn("Message {} exceeded max retries ({}), skipping", messageId, MAX_RETRIES);
            return;
        }

        try {
            conversationService.processMessage(messageId);
        } catch (Exception e) {
            // Increment retry count, clear processed flag, update lastRetryAt
            message.setRetryCount(message.getRetryCount() + 1);
            message.setProcessed(false);
            message.setProcessedAt(null);
            message.setLastRetryAt(LocalDateTime.now());
            whatsAppMessageRepository.save(message);
            log.error("Error processing message {} (retry {}/{}): {}",
                    messageId, message.getRetryCount(), MAX_RETRIES, e.getMessage(), e);
        }
    }

    /**
     * Re-enqueue messages that failed (processed=false) and have retries remaining.
     * Runs every 30 seconds to pick up messages that were not retried via the queue.
     * Limited to 100 messages per run to prevent memory pressure (MEDIUM fix).
     */
    @Scheduled(fixedDelay = 30000)
    public void requeueFailedMessages() {
        Pageable pageable = PageRequest.of(0, 100);
        Page<WhatsAppMessage> failedPage = whatsAppMessageRepository
                .findByProcessedFalseAndRetryCountLessThanOrderByCreatedAtAsc(MAX_RETRIES, pageable);

        int requeued = 0;
        for (WhatsAppMessage msg : failedPage.getContent()) {
            // Use lastRetryAt for backoff; fall back to createdAt for messages never retried
            LocalDateTime lastAttempt = msg.getLastRetryAt() != null ? msg.getLastRetryAt() : msg.getCreatedAt();
            if (lastAttempt != null && lastAttempt.isBefore(LocalDateTime.now().minusMinutes(1))) {
                // Only re-enqueue if at least 1 minute has passed since last attempt
                // Update lastRetryAt immediately to prevent duplicate re-enqueue (HIGH fix)
                msg.setLastRetryAt(LocalDateTime.now());
                whatsAppMessageRepository.save(msg);
                messageQueueService.enqueue(msg.getId());
                requeued++;
            }
        }

        if (requeued > 0) {
            log.info("Re-enqueued {} failed messages for retry", requeued);
        }
    }
}