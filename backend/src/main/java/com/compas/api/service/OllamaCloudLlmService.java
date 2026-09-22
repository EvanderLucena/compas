package com.compas.api.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.dto.llm.ExtractionItemResult;
import com.compas.api.dto.llm.ExtractionResult;
import com.compas.api.dto.llm.LlmIntent;
import com.compas.api.dto.llm.LlmRequest;
import com.compas.api.dto.llm.LlmResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ollama Cloud LLM implementation via OpenAI-compatible REST API.
 * Provider swap requires only config changes (D-02): base-url, model, api-key.
 */
public class OllamaCloudLlmService implements LlmService {

    private static final Logger log = LoggerFactory.getLogger(OllamaCloudLlmService.class);

    private static final Pattern CODE_BLOCK_PATTERN =
            Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)(?:```|$)", Pattern.CASE_INSENSITIVE);


    private final String baseUrl;
    private final String model;
    private final String apiKey;
    private final int timeoutSeconds;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OllamaCloudLlmService(String baseUrl, String model, String apiKey, int timeoutSeconds) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.apiKey = apiKey;
        this.timeoutSeconds = timeoutSeconds;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    @Override
    public LlmResponse chat(LlmRequest request) {
        try {
            Object userContent;
            if (request.imageUrl() != null && !request.imageUrl().isBlank()) {
                userContent = List.of(
                        java.util.Map.of("type", "text", "text",
                                request.userMessage() != null ? request.userMessage() : ""),
                        java.util.Map.of("type", "image_url", "image_url",
                                java.util.Map.of("url", request.imageUrl()))
                );
            } else {
                userContent = request.userMessage();
            }

            ChatCompletionRequest apiRequest = new ChatCompletionRequest(
                    model,
                    List.of(
                            new ChatMessage("system", request.systemPrompt()),
                            new ChatMessage("user", userContent)
                    ),
                    request.temperature(),
                    request.maxTokens()
            );

            String requestBody = objectMapper.writeValueAsString(apiRequest);

            HttpRequest.Builder httpRequestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(timeoutSeconds));

            if (apiKey != null && !apiKey.isBlank()) {
                httpRequestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> httpResponse = httpClient.send(
                    httpRequestBuilder.build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                log.error("LLM API error: status={}, body={}", httpResponse.statusCode(),
                        truncate(httpResponse.body(), 500));
                return LlmResponse.failed("LLM API error: " + httpResponse.statusCode());
            }

            ChatCompletionResponse response = objectMapper.readValue(
                    httpResponse.body(), ChatCompletionResponse.class);

            if (response.choices() == null || response.choices().isEmpty()
                    || response.choices().get(0).message() == null) {
                log.error("LLM API returned empty response");
                return LlmResponse.failed("LLM returned empty response");
            }

            String content = response.choices().get(0).message().content();
            if (content == null || content.isBlank()) {
                log.error("LLM API returned blank content");
                return LlmResponse.failed("LLM returned blank content");
            }

            // Parse intent and extraction from the response
            return parseLlmResponse(content, request.userMessage());

        } catch (java.net.http.HttpTimeoutException e) {
            log.error("LLM API timeout after {}s", timeoutSeconds);
            return LlmResponse.failed("LLM API timeout after " + timeoutSeconds + "s");
        } catch (JsonProcessingException e) {
            log.error("LLM API response parsing error: {}", e.getMessage());
            return LlmResponse.failed("LLM response parsing error");
        } catch (Exception e) {
            log.error("LLM API call failed: {}", e.getMessage(), e);
            return LlmResponse.failed("LLM API call failed: " + e.getMessage());
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/models"))
                    .timeout(Duration.ofSeconds(5))
                    .GET();

            if (apiKey != null && !apiKey.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpRequest request = requestBuilder.build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.warn("LLM availability check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Parse the LLM response content to extract intent and structured extraction data.
     * The LLM may embed JSON within markdown code blocks or inline.
     */
    LlmResponse parseLlmResponse(String content, String originalMessage) {
        LlmIntent intent = classifyIntent(content, originalMessage);
        ExtractionResult extraction = null;

        if (intent == LlmIntent.MEAL_REPORT) {
            extraction = parseExtraction(content, originalMessage);
        }

        return new LlmResponse(content, intent, extraction, true, null);
    }

    /**
     * Classify intent based on the response content and original message.
     * The system prompt instructs the model to produce extraction JSON for meal reports.
     */
    private LlmIntent classifyIntent(String responseContent, String originalMessage) {
        // If the response contains extraction JSON structure, it's a meal report
        if (responseContent.contains("\"mealLabel\"")
                || responseContent.contains("\"items\"")
                || responseContent.contains("\"meals\"")) {
            return LlmIntent.MEAL_REPORT;
        }

        String lowerMessage = originalMessage.toLowerCase();
        // Meal report keywords (pt-BR)
        if (lowerMessage.contains("comi") || lowerMessage.contains("almoc") ||
                lowerMessage.contains("jantei") || lowerMessage.contains("cafe") ||
                lowerMessage.contains("lanche") || lowerMessage.contains("ceia") ||
                lowerMessage.contains("refeicao") || lowerMessage.contains("refeição") ||
                lowerMessage.contains("almoço") || lowerMessage.contains("café") ||
                lowerMessage.contains("prato") || lowerMessage.contains("foto")) {
            return LlmIntent.MEAL_REPORT;
        }

        // Plan question keywords
        if (lowerMessage.contains("plano") || lowerMessage.contains("posso comer") ||
                lowerMessage.contains("posso comer") || lowerMessage.contains("quantos") ||
                lowerMessage.contains("qual a") || lowerMessage.contains("como ta") ||
                lowerMessage.contains("como está") || lowerMessage.contains("meta")) {
            return LlmIntent.PLAN_QUESTION;
        }

        // Greeting keywords
        if (lowerMessage.matches("^(oi|ola|olá|bom dia|boa tarde|boa noite|eai|e aí|hey|hello|hi)[\\s!.?]*$") ||
                lowerMessage.length() <= 10 && lowerMessage.matches("^(oi|olá|ola|hey|hi|hello)[\\s!.?]*")) {
            return LlmIntent.GREETING;
        }

        return LlmIntent.MISCELLANEOUS;
    }

    /**
     * Parse extraction JSON from response content.
     * Handles single meal objects, {"meals": [...]}, and top-level arrays.
     */
    private ExtractionResult parseExtraction(String content, String originalMessage) {
        String json = extractJsonContent(content);
        if (json == null || json.isBlank()) {
            log.warn("Could not find extraction JSON in LLM response");
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            if (root.has("meals") && root.get("meals").isArray()) {
                List<ExtractionResult> mealList = new ArrayList<>();
                for (JsonNode mealNode : root.get("meals")) {
                    String label = mealNode.has("mealLabel") ? mealNode.get("mealLabel").asText() : null;
                    List<ExtractionItemResult> items = parseItems(mealNode.get("items"));
                    mealList.add(new ExtractionResult(label, items, originalMessage));
                }
                if (!mealList.isEmpty()) {
                    return new ExtractionResult(
                            mealList.get(0).mealLabel(), mealList.get(0).items(), originalMessage, mealList);
                }
            } else if (root.isArray()) {
                List<ExtractionResult> mealList = new ArrayList<>();
                for (JsonNode mealNode : root) {
                    String label = mealNode.has("mealLabel") ? mealNode.get("mealLabel").asText() : null;
                    List<ExtractionItemResult> items = parseItems(mealNode.get("items"));
                    mealList.add(new ExtractionResult(label, items, originalMessage));
                }
                if (!mealList.isEmpty()) {
                    return new ExtractionResult(
                            mealList.get(0).mealLabel(), mealList.get(0).items(), originalMessage, mealList);
                }
            } else {
                // Single meal object
                String label = root.has("mealLabel") ? root.get("mealLabel").asText() : null;
                List<ExtractionItemResult> items = parseItems(root.get("items"));
                return new ExtractionResult(label, items, originalMessage);
            }
        } catch (Exception e) {
            log.warn("Failed to parse extraction JSON: {}", e.getMessage());
        }
        return null;
    }

    private String extractJsonContent(String content) {
        if (content == null) {
            return null;
        }
        // 1. Try markdown code block (```json ... ``` or ``` ... ```)
        Matcher blockMatcher = CODE_BLOCK_PATTERN.matcher(content);
        if (blockMatcher.find()) {
            String block = blockMatcher.group(1).trim();
            if (block.startsWith("{") || block.startsWith("[")) {
                return block;
            }
        }

        // 2. Try raw JSON substring from first '{' to last '}'
        int firstBrace = content.indexOf('{');
        int lastBrace = content.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace > firstBrace) {
            return content.substring(firstBrace, lastBrace + 1).trim();
        }

        // 3. Try raw JSON array substring from first '[' to last ']'
        int firstBracket = content.indexOf('[');
        int lastBracket = content.lastIndexOf(']');
        if (firstBracket != -1 && lastBracket > firstBracket) {
            return content.substring(firstBracket, lastBracket + 1).trim();
        }

        return null;
    }

    private List<ExtractionItemResult> parseItems(JsonNode itemsNode) {
        if (itemsNode == null || !itemsNode.isArray()) {
            return List.of();
        }
        List<ExtractionItemResult> list = new ArrayList<>();
        for (JsonNode item : itemsNode) {
            String name = item.has("name") ? item.get("name").asText() : "Alimento";
            Double grams = item.has("grams") && !item.get("grams").isNull() ? item.get("grams").asDouble() : null;
            double kcal = item.has("kcal") ? item.get("kcal").asDouble() : 0.0;
            double prot = item.has("prot") ? item.get("prot").asDouble() : 0.0;
            double carb = item.has("carb") ? item.get("carb").asDouble() : 0.0;
            double fat = item.has("fat") ? item.get("fat").asDouble() : 0.0;
            list.add(new ExtractionItemResult(name, grams, kcal, prot, carb, fat));
        }
        return list;
    }


    private String truncate(String s, int maxLen) {
        if (s == null) {
            return "null";
        }
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }

    // --- Internal DTOs for API communication ---

    record ChatCompletionRequest(
            String model,
            List<ChatMessage> messages,
            double temperature,
            int max_tokens
    ) {}

    record ChatMessage(String role, Object content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatCompletionResponse(
            List<Choice> choices
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(ResponseMessage message) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ResponseMessage(String content) {}
}
