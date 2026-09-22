package com.compas.api.service;

import com.compas.api.auth.TenantContext;
import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.WhatsAppMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Async queue worker that processes enqueued messages concurrently.
 * Drains Redis queue using virtual threads with bounded concurrency.
 * Retries failed messages up to 3 times (D-09 + WR-05).
 */
@Component
public class MessageProcessorWorker {

    private static final Logger log = LoggerFactory.getLogger(MessageProcessorWorker.class);
    private static final int MAX_RETRIES = 3;

    private final MessageQueueService messageQueueService;
    private final ConversationService conversationService;
    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final Executor executor;
    private final Semaphore concurrencySemaphore;

    @Autowired
    public MessageProcessorWorker(
            MessageQueueService messageQueueService,
            ConversationService conversationService,
            WhatsAppMessageRepository whatsAppMessageRepository,
            @Value("${compas.whatsapp.worker.max-concurrent:${nutriai.whatsapp.worker.max-concurrent:5}}")
            int maxConcurrent) {
        this(
                messageQueueService,
                conversationService,
                whatsAppMessageRepository,
                Executors.newVirtualThreadPerTaskExecutor(),
                maxConcurrent
        );
    }

    public MessageProcessorWorker(
            MessageQueueService messageQueueService,
            ConversationService conversationService,
            WhatsAppMessageRepository whatsAppMessageRepository,
            Executor executor,
            int maxConcurrent) {
        this.messageQueueService = messageQueueService;
        this.conversationService = conversationService;
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.executor = executor != null ? executor : Executors.newVirtualThreadPerTaskExecutor();
        this.concurrencySemaphore = new Semaphore(Math.max(1, maxConcurrent));
    }

    /**
     * Poll Redis and process pending messages concurrently.
     * Runs every second via Spring @Scheduled.
     */
    @Scheduled(fixedDelay = 1000)
    public void processNextMessage() {
        while (concurrencySemaphore.tryAcquire()) {
            Optional<UUID> messageIdOpt = messageQueueService.dequeue();
            if (messageIdOpt.isEmpty()) {
                concurrencySemaphore.release();
                break;
            }

            UUID messageId = messageIdOpt.get();
            boolean submitted = false;
            try {
                executor.execute(() -> {
                    try {
                        processSingleMessage(messageId);
                    } finally {
                        concurrencySemaphore.release();
                    }
                });
                submitted = true;
            } finally {
                if (!submitted) {
                    concurrencySemaphore.release();
                }
            }
        }
    }

    public void processSingleMessage(UUID messageId) {
        AtomicReference<Optional<WhatsAppMessage>> msgRef = new AtomicReference<>();
        TenantContext.executeWithBypass(() -> {
            Optional<WhatsAppMessage> msgOpt = whatsAppMessageRepository.findById(messageId);
            if (msgOpt.isEmpty()) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                msgOpt = whatsAppMessageRepository.findById(messageId);
            }
            msgRef.set(msgOpt);
        });

        Optional<WhatsAppMessage> msgOpt = msgRef.get();
        if (msgOpt == null || msgOpt.isEmpty()) {
            log.warn("Message {} not found in DB, dropping from queue", messageId);
            return;
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

        Runnable processTask = () -> {
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
        };

        if (message.getNutritionistId() != null) {
            TenantContext.executeAsTenant(message.getNutritionistId(), processTask);
        } else {
            TenantContext.executeWithBypass(processTask);
        }
    }

    /**
     * Re-enqueue messages that failed (processed=false) and have retries remaining.
     * Runs every 30 seconds to pick up messages that were not retried via the queue.
     * Limited to 100 messages per run to prevent memory pressure (MEDIUM fix).
     */
    @Scheduled(fixedDelay = 30000)
    public void requeueFailedMessages() {
        TenantContext.executeWithBypass(() -> {
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
        });
    }
}