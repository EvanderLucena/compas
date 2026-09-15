package com.nutriai.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhisperAudioTranscriptionServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private WhisperAudioTranscriptionService whisperService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        whisperService = new WhisperAudioTranscriptionService(
                "https://api.openai.com/v1",
                "whisper-1",
                "test-api-key",
                "pt",
                true,
                30,
                httpClient,
                objectMapper
        );
    }

    @Test
    void transcribe_disabled_returnsEmptyWithoutCallingHttp() throws IOException, InterruptedException {
        WhisperAudioTranscriptionService disabledService = new WhisperAudioTranscriptionService(
                "https://api.openai.com/v1", "whisper-1", "test-key", "pt", false, 30, httpClient, objectMapper);

        Optional<String> result = disabledService.transcribe(new byte[]{1, 2, 3}, "audio.ogg");

        assertTrue(result.isEmpty());
        verify(httpClient, never()).send(any(HttpRequest.class), any());
    }

    @Test
    void transcribe_emptyAudioBytes_returnsEmptyWithoutCallingHttp() throws IOException, InterruptedException {
        Optional<String> result = whisperService.transcribe(new byte[0], "audio.ogg");

        assertTrue(result.isEmpty());
        verify(httpClient, never()).send(any(HttpRequest.class), any());
    }

    @Test
    void transcribe_nullAudioBytes_returnsEmptyWithoutCallingHttp() throws IOException, InterruptedException {
        Optional<String> result = whisperService.transcribe(null, "audio.ogg");

        assertTrue(result.isEmpty());
        verify(httpClient, never()).send(any(HttpRequest.class), any());
    }

    @Test
    void transcribe_successfulApiResponse_returnsTranscribedText() throws IOException, InterruptedException {
        byte[] audioBytes = "fake-audio-bytes".getBytes();
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"text\": \"Almocei arroz com feijão e frango grelhado\"}");
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        Optional<String> result = whisperService.transcribe(audioBytes, "audio.ogg");

        assertTrue(result.isPresent());
        assertEquals("Almocei arroz com feijão e frango grelhado", result.get());
    }

    @Test
    void transcribe_apiReturnsErrorStatus_returnsEmpty() throws IOException, InterruptedException {
        byte[] audioBytes = "fake-audio-bytes".getBytes();
        when(httpResponse.statusCode()).thenReturn(500);
        when(httpResponse.body()).thenReturn("{\"error\": \"Internal server error\"}");
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        Optional<String> result = whisperService.transcribe(audioBytes, "audio.ogg");

        assertTrue(result.isEmpty());
    }

    @Test
    void transcribe_apiReturnsJsonWithoutText_returnsEmpty() throws IOException, InterruptedException {
        byte[] audioBytes = "fake-audio-bytes".getBytes();
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"result\": \"ok\"}");
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        Optional<String> result = whisperService.transcribe(audioBytes, "audio.ogg");

        assertTrue(result.isEmpty());
    }

    @Test
    void isAvailable_checksEnabledAndBaseUrl() {
        assertTrue(whisperService.isAvailable());

        WhisperAudioTranscriptionService disabledService = new WhisperAudioTranscriptionService(
                "https://api.openai.com/v1", "whisper-1", "test-key", "pt", false, 30, httpClient, objectMapper);
        assertFalse(disabledService.isAvailable());

        WhisperAudioTranscriptionService emptyUrlService = new WhisperAudioTranscriptionService(
                "", "whisper-1", "test-key", "pt", true, 30, httpClient, objectMapper);
        assertFalse(emptyUrlService.isAvailable());
    }
}
