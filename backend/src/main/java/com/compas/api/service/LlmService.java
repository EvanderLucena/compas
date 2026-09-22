package com.compas.api.service;

import com.compas.api.dto.llm.LlmRequest;
import com.compas.api.dto.llm.LlmResponse;

/**
 * Abstract LLM provider interface.
 * Swapping providers requires only config changes (D-02).
 */
public interface LlmService {

    /**
     * Send a chat message and receive a response.
     * Single call per message handles both classification and response (D-01).
     */
    LlmResponse chat(LlmRequest request);

    /**
     * Check if the LLM service is available.
     */
    boolean isAvailable();
}
