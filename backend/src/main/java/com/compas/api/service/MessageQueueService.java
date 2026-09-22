package com.compas.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Redis-backed async message queue for WhatsApp processing.
 * Abstracted behind a simple interface for future provider swaps (D-09).
 */
@Service
public class MessageQueueService {

    private static final Logger log = LoggerFactory.getLogger(MessageQueueService.class);
    private static final String QUEUE_KEY = "whatsapp:process";
    private static final String DEAD_LETTER_QUEUE_KEY = "whatsapp:process:dead-letter";
    private static final int QUEUE_DEPTH_WARN_THRESHOLD = 100;

    private final StringRedisTemplate redisTemplate;

    public MessageQueueService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Enqueue a message ID for async processing.
     */
    public void enqueue(UUID messageId) {
        redisTemplate.opsForList().leftPush(QUEUE_KEY, messageId.toString());
        Long depth = redisTemplate.opsForList().size(QUEUE_KEY);
        if (depth != null && depth > QUEUE_DEPTH_WARN_THRESHOLD) {
            log.warn("WhatsApp queue depth {} exceeds threshold {}", depth, QUEUE_DEPTH_WARN_THRESHOLD);
        }
    }

    /**
     * Dequeue the next message ID for processing.
     */
    public Optional<UUID> dequeue() {
        String value = redisTemplate.opsForList().rightPop(QUEUE_KEY, Duration.ofSeconds(1));
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID in queue: {}", value);
            redisTemplate.opsForList().leftPush(DEAD_LETTER_QUEUE_KEY, value);
            return Optional.empty();
        }
    }

    /**
     * Get current queue depth.
     */
    public long getQueueDepth() {
        Long depth = redisTemplate.opsForList().size(QUEUE_KEY);
        return depth != null ? depth : 0;
    }
}
