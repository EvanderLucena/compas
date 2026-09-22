package com.compas.api.dto.llm;

/**
 * DTO for LLM chat responses.
 */
public record LlmResponse(
    String content,
    LlmIntent intent,
    ExtractionResult extraction,
    boolean success,
    String errorMessage
) {
    public static LlmResponse failed(String error) {
        return new LlmResponse(null, null, null, false, error);
    }
}
