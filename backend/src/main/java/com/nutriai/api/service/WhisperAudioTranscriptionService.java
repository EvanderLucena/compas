package com.nutriai.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Audio transcription implementation using OpenAI-compatible Whisper REST API.
 */
public class WhisperAudioTranscriptionService implements AudioTranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(WhisperAudioTranscriptionService.class);

    private final String baseUrl;
    private final String model;
    private final String apiKey;
    private final String language;
    private final boolean enabled;
    private final int timeoutSeconds;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public WhisperAudioTranscriptionService(
            String baseUrl,
            String model,
            String apiKey,
            String language,
            boolean enabled,
            int timeoutSeconds) {
        this.baseUrl = baseUrl;
        this.model = model != null && !model.isBlank() ? model : "whisper-1";
        this.apiKey = apiKey;
        this.language = language != null && !language.isBlank() ? language : "pt";
        this.enabled = enabled;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 30;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    WhisperAudioTranscriptionService(
            String baseUrl,
            String model,
            String apiKey,
            String language,
            boolean enabled,
            int timeoutSeconds,
            HttpClient httpClient,
            ObjectMapper objectMapper) {
        this.baseUrl = baseUrl;
        this.model = model != null && !model.isBlank() ? model : "whisper-1";
        this.apiKey = apiKey;
        this.language = language != null && !language.isBlank() ? language : "pt";
        this.enabled = enabled;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 30;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<String> transcribe(byte[] audioBytes, String filename) {
        if (!enabled) {
            log.debug("Whisper transcription is disabled, skipping");
            return Optional.empty();
        }

        if (audioBytes == null || audioBytes.length == 0) {
            log.warn("Empty audio bytes received for transcription");
            return Optional.empty();
        }

        String safeFilename = filename != null && !filename.isBlank() ? filename : "audio.ogg";

        try {
            String boundary = "----NutriAiBoundary" + UUID.randomUUID().toString().replace("-", "");
            byte[] multipartBody = buildMultipartBody(boundary, safeFilename, audioBytes);

            String endpoint = baseUrl.replaceAll("/+$", "") + "/audio/transcriptions";
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .timeout(Duration.ofSeconds(timeoutSeconds));

            if (apiKey != null && !apiKey.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> response = httpClient.send(
                    requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("text")) {
                    String text = root.get("text").asText().trim();
                    log.info("Whisper transcription successful: {} chars", text.length());
                    return Optional.of(text);
                }
                log.warn("Whisper response missing 'text' field: {}", response.body());
                return Optional.empty();
            }

            log.error("Whisper transcription API error: status={}, body={}",
                    response.statusCode(), truncate(response.body(), 200));
            return Optional.empty();

        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Whisper transcription timed out after {}s", timeoutSeconds);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Whisper transcription failed: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    @Override
    public boolean isAvailable() {
        return enabled && baseUrl != null && !baseUrl.isBlank();
    }

    private byte[] buildMultipartBody(String boundary, String filename, byte[] fileData) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // Model field
        writeFormField(out, boundary, "model", model);

        // Language field
        if (language != null && !language.isBlank()) {
            writeFormField(out, boundary, "language", language);
        }

        // File field
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"file\"; filename=\""
                + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + resolveContentType(filename) + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(fileData);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));

        // Closing boundary
        out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        return out.toByteArray();
    }

    private void writeFormField(ByteArrayOutputStream out, String boundary, String name, String value)
            throws IOException {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write((value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private String resolveContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".ogg")) {
            return "audio/ogg";
        }
        if (lower.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) {
            return "audio/mp4";
        }
        if (lower.endsWith(".wav")) {
            return "audio/wav";
        }
        if (lower.endsWith(".webm")) {
            return "audio/webm";
        }
        return "application/octet-stream";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) {
            return "null";
        }
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
