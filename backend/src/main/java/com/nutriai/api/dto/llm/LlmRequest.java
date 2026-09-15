package com.nutriai.api.dto.llm;

/**
 * DTO for LLM chat requests. Supports multimodal vision requests via optional imageUrl.
 */
public record LlmRequest(
    String systemPrompt,
    String userMessage,
    String imageUrl,
    double temperature,
    int maxTokens
) {
    public LlmRequest {
        if (temperature < 0) {
            temperature = 0.3;
        }
        if (maxTokens <= 0) {
            maxTokens = 1000;
        }
    }

    public LlmRequest(String systemPrompt, String userMessage) {
        this(systemPrompt, userMessage, null, 0.3, 1000);
    }

    public LlmRequest(String systemPrompt, String userMessage, String imageUrl) {
        this(systemPrompt, userMessage, imageUrl, 0.3, 1000);
    }

    public LlmRequest(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        this(systemPrompt, userMessage, null, temperature, maxTokens);
    }
}

