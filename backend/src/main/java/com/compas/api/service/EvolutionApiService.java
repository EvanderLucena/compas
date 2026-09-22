package com.compas.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

/**
 * Sends WhatsApp messages via Evolution Go API.
 * Logs failures but doesn't throw — failures in sending should not crash the processing pipeline.
 */
public class EvolutionApiService {

    private static final Logger log = LoggerFactory.getLogger(EvolutionApiService.class);
    private static final int MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max media payload

    private final String apiUrl;
    private final String apiKey;
    private final String instanceName;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EvolutionApiService(String apiUrl, String apiKey, String instanceName) {
        this(apiUrl, apiKey, instanceName, new ObjectMapper());
    }

    public EvolutionApiService(String apiUrl, String apiKey, String instanceName, ObjectMapper objectMapper) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.instanceName = instanceName;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Send a text message via Evolution Go API.
     *
     * @param phone the recipient phone number (normalized, with country code e.g. 5511999999999)
     * @param text  the message text to send
     * @return true if the message was sent successfully, false otherwise
     */
    public boolean sendMessage(String phone, String text) {
        try {
            String targetPhone = formatTargetPhone(phone);
            String endpoint = apiUrl + "/send/text";
            String payload = String.format(
                    "{\"number\":\"%s\",\"text\":\"%s\"}",
                    escapeJson(targetPhone),
                    escapeJson(text)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Message sent via Evolution API: phone={}, status={}",
                        maskPhone(targetPhone), response.statusCode());
                return true;
            }

            // Retry once on server error or timeout
            if (response.statusCode() >= 500) {
                log.warn("Evolution API server error ({}), retrying...", response.statusCode());
                Thread.sleep(500);

                HttpResponse<String> retryResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (retryResponse.statusCode() >= 200 && retryResponse.statusCode() < 300) {
                    log.info("Message sent on retry: phone={}", maskPhone(targetPhone));
                    return true;
                }
                log.error("Evolution API retry failed: status={}", retryResponse.statusCode());
                return false;
            }

            log.error("Evolution API client error: status={}, body={}", response.statusCode(),
                    truncate(response.body(), 200));
            return false;

        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Evolution API timeout sending message to {}", maskPhone(phone));
            return retrySendOnce(phone, text);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Evolution API send interrupted: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Evolution API send failed: {}", e.getMessage(), e);
            return retrySendOnce(phone, text);
        }
    }

    private boolean retrySendOnce(String phone, String text) {
        try {
            String targetPhone = formatTargetPhone(phone);
            String endpoint = apiUrl + "/send/text";
            String payload = String.format(
                    "{\"number\":\"%s\",\"text\":\"%s\"}",
                    escapeJson(targetPhone),
                    escapeJson(text)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean success = response.statusCode() >= 200 && response.statusCode() < 300;
            if (!success) {
                log.error("Evolution API retry also failed: status={}", response.statusCode());
            }
            return success;
        } catch (Exception e) {
            log.error("Evolution API retry failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Download or extract binary media bytes from a media URL or data URI.
     *
     * @param mediaUrl the media URL or data URI (base64)
     * @return Optional containing the downloaded bytes, or empty if download failed
     */
    public Optional<byte[]> downloadMedia(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return Optional.empty();
        }

        try {
            if (mediaUrl.startsWith("data:")) {
                int commaIndex = mediaUrl.indexOf(',');
                if (commaIndex != -1) {
                    String base64Data = mediaUrl.substring(commaIndex + 1);
                    byte[] decoded = Base64.getDecoder().decode(base64Data.trim());
                    if (decoded.length > MAX_MEDIA_SIZE_BYTES) {
                        log.warn("Data URI media exceeds maximum size limit ({} > {} bytes)",
                                decoded.length, MAX_MEDIA_SIZE_BYTES);
                        return Optional.empty();
                    }
                    return Optional.of(decoded);
                }
            }

            if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
                if (!isSafeMediaUrl(mediaUrl)) {
                    log.warn("Media URL rejected by host allowlist: {}", truncate(mediaUrl, 80));
                    return Optional.empty();
                }

                HttpRequest.Builder builder = HttpRequest.newBuilder()
                        .uri(URI.create(mediaUrl))
                        .GET()
                        .timeout(Duration.ofSeconds(15));

                if (apiKey != null && !apiKey.isBlank() && mediaUrl.startsWith(apiUrl)) {
                    builder.header("apikey", apiKey);
                }

                HttpResponse<byte[]> response = httpClient.send(
                        builder.build(), HttpResponse.BodyHandlers.ofByteArray());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    byte[] body = response.body();
                    if (body.length > MAX_MEDIA_SIZE_BYTES) {
                        log.warn("Media payload exceeds maximum size limit ({} > {} bytes)",
                                body.length, MAX_MEDIA_SIZE_BYTES);
                        return Optional.empty();
                    }
                    return Optional.of(body);
                }
                log.warn("Failed to download media: status={}, url={}",
                        response.statusCode(), truncate(mediaUrl, 80));
            }
        } catch (Exception e) {
            log.warn("Error downloading media from {}: {}", truncate(mediaUrl, 80), e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Validate that a media URL originates strictly from the configured Evolution API host.
     * Prevents SSRF and DNS rebinding / TOCTOU attacks.
     */
    boolean isSafeMediaUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return false;
        }
        try {
            URI mediaUri = URI.create(mediaUrl);
            String scheme = mediaUri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }

            String host = mediaUri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }

            // Only allow media originating from the configured Evolution API instance host
            String apiHost = URI.create(apiUrl).getHost();
            if (apiHost != null) {
                if (apiHost.equalsIgnoreCase(host)) {
                    return true;
                }
                if (("localhost".equalsIgnoreCase(apiHost) || "127.0.0.1".equals(apiHost))
                        && ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host))) {
                    return true;
                }
            }

            log.warn("Blocked media download: host {} does not match configured Evolution API host {}",
                    host, apiHost);
            return false;
        } catch (Exception e) {
            log.warn("Invalid media URL {}: {}", truncate(mediaUrl, 80), e.getMessage());
            return false;
        }
    }

    /**
     * Fetch media as a Base64 Data URI (e.g. data:image/jpeg;base64,...).
     *
     * @param mediaUrl        the media URL or data URI
     * @param defaultMimeType default MIME type if data URI doesn't specify one
     * @return Optional containing the Base64 data URI, or empty if download failed
     */
    public Optional<String> getMediaAsBase64DataUri(String mediaUrl, String defaultMimeType) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return Optional.empty();
        }
        if (mediaUrl.startsWith("data:")) {
            int commaIndex = mediaUrl.indexOf(',');
            if (commaIndex != -1) {
                String base64Data = mediaUrl.substring(commaIndex + 1);
                if (base64Data.length() > MAX_MEDIA_SIZE_BYTES * 4 / 3 + 1024) {
                    log.warn("Data URI media exceeds maximum size limit ({} chars)", base64Data.length());
                    return Optional.empty();
                }
            }
            return Optional.of(mediaUrl);
        }
        return downloadMedia(mediaUrl).map(bytes -> {
            String mime = defaultMimeType != null ? defaultMimeType : "image/jpeg";
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        });
    }

    /**
     * Download and decrypt media from an Evolution API WhatsApp message payload.
     * Uses Evolution Go's /message/downloadmedia endpoint.
     *
     * @param messageContent the message content object (e.g. MessageContent)
     * @return Optional containing the Data URL (e.g. data:audio/ogg;base64,...), or empty
     */
    public Optional<String> downloadMediaDataUrl(Object messageContent) {
        if (messageContent == null) {
            return Optional.empty();
        }
        try {
            Map<String, Object> requestPayload = Map.of("message", messageContent);
            String jsonPayload = objectMapper.writeValueAsString(requestPayload);

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/message/downloadmedia"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(30));

            if (apiKey != null && !apiKey.isBlank()) {
                builder.header("apikey", apiKey);
            }

            HttpResponse<String> response = httpClient.send(
                    builder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode dataNode = root.path("data");
                if (!dataNode.isMissingNode() && dataNode.has("base64")) {
                    String base64 = dataNode.path("base64").asText();
                    if (base64 != null && !base64.isBlank()) {
                        return Optional.of(base64);
                    }
                }
            } else {
                log.warn("Evolution API /message/downloadmedia failed: status={}, body={}",
                        response.statusCode(), truncate(response.body(), 200));
            }
        } catch (Exception e) {
            log.warn("Error calling /message/downloadmedia: {}", e.getMessage());
        }
        return Optional.empty();
    }

    private String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder escaped = new StringBuilder(s.length());
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case '\\' -> escaped.append("\\\\");
                case '"' -> escaped.append("\\\"");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (ch <= 0x1F) {
                        escaped.append(String.format("\\u%04x", (int) ch));
                    } else {
                        escaped.append(ch);
                    }
                }
            }
        }
        return escaped.toString();
    }

    /**
     * Formats phone number ensuring full international format for Brazilian numbers.
     * Brazilian numbers without country code have 10 (landline) or 11 (mobile) digits.
     * Numbers that already include 55 country code have 12 or 13 digits.
     */
    public static String formatTargetPhone(String rawPhone) {
        if (rawPhone == null) {
            return "";
        }
        String digits = rawPhone.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return "";
        }
        if (digits.length() <= 11) {
            return "55" + digits;
        }
        return digits;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "***";
        }
        return phone.substring(0, 2) + "***" + phone.substring(phone.length() - 2);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) {
            return "null";
        }
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
