package com.compas.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.compas.api.dto.jev.JevDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TypeSafeJevServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private TypeSafeJevService jevService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        jevService = new TypeSafeJevService(
                "https://api.typesafe.ai/v1/systemone",
                "test-api-key",
                "jev-latest",
                true,
                5,
                httpClient
        );
    }

    @Test
    void isAvailable_whenConfigured_returnsTrue() {
        assertTrue(jevService.isAvailable());
    }

    @Test
    void isAvailable_whenNoKeyOrDisabled_returnsFalse() {
        TypeSafeJevService noKeyService = new TypeSafeJevService(
                "https://api.typesafe.ai/v1/systemone",
                "",
                "jev-latest",
                true,
                5
        );
        assertFalse(noKeyService.isAvailable());

        TypeSafeJevService disabledService = new TypeSafeJevService(
                "https://api.typesafe.ai/v1/systemone",
                "test-key",
                "jev-latest",
                false,
                5
        );
        assertFalse(disabledService.isAvailable());
    }

    @Test
    void analyzePatientMessage_whenNotAvailable_returnsFallback() throws Exception {
        TypeSafeJevService disabledService = new TypeSafeJevService(
                "https://api.typesafe.ai/v1/systemone",
                "test-key",
                "jev-latest",
                false,
                5,
                httpClient
        );


        JevDecision decision = disabledService.analyzePatientMessage("Comi almoço saudável");

        assertNotNull(decision);
        assertFalse(decision.success());
        assertEquals("unknown", decision.intent());
        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void analyzePatientMessage_whenBlankMessage_returnsFallback() throws Exception {
        JevDecision decision = jevService.analyzePatientMessage("   ");

        assertNotNull(decision);
        assertFalse(decision.success());
        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void analyzePatientMessage_success() throws Exception {
        String mockJsonResponse = """
                {
                  "model": "jev-1.13.0",
                  "answers": {
                    "intent": {
                      "type": "choice",
                      "choice": "meal_log",
                      "confidence": 1.0,
                      "probabilities": { "meal_log": 1.0, "doubt": 0.0 }
                    },
                    "sentiment": {
                      "type": "choice",
                      "choice": "struggling",
                      "confidence": 0.98,
                      "probabilities": { "struggling": 0.98, "neutral": 0.02 }
                    },
                    "requires_human_attention": {
                      "type": "noul",
                      "noul": 0.92
                    }
                  },
                  "usage": { "input_tokens": 400, "output_tokens": 80 }
                }
                """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockJsonResponse);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        JevDecision decision = jevService.analyzePatientMessage("Comi bolo de chocolate e estou me sentindo culpado");

        assertNotNull(decision);
        assertTrue(decision.success());
        assertEquals("meal_log", decision.intent());
        assertEquals(1.0, decision.intentConfidence());
        assertEquals("struggling", decision.sentiment());
        assertEquals(0.98, decision.sentimentConfidence());
        assertEquals(0.92, decision.attentionScore());
        assertTrue(decision.requiresHumanAttention());
        assertEquals("jev-1.13.0", decision.model());
    }

    @Test
    void analyzePatientMessage_whenHttpError_returnsFallback() throws Exception {
        when(httpResponse.statusCode()).thenReturn(500);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        JevDecision decision = jevService.analyzePatientMessage("Oi nutri!");

        assertNotNull(decision);
        assertFalse(decision.success());
        assertEquals("unknown", decision.intent());
    }


    @Test
    void analyzePatientMessage_whenExceptionThrown_returnsFallback() throws Exception {
        when(httpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Connection timed out"));

        JevDecision decision = jevService.analyzePatientMessage("Oi nutri!");

        assertNotNull(decision);
        assertFalse(decision.success());
        assertEquals("unknown", decision.intent());
    }

    @Test
    void validateMealSanity_whenPlausible_returnsPlausibleDecision() throws Exception {
        String mockResponse = """
                {
                  "model": "jev-latest",
                  "answers": {
                    "is_plausible": { "type": "choice", "choice": "yes", "confidence": 0.99 },
                    "risk_flag": { "type": "choice", "choice": "NORMAL", "confidence": 0.95 }
                  }
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockResponse);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        var decision = jevService.validateMealSanity("Almoço arroz e frango", "Almoço", 450.0, 300.0, java.util.List.of("arroz", "frango"));

        assertNotNull(decision);
        assertTrue(decision.success());
        assertTrue(decision.isPlausible());
        assertEquals("NORMAL", decision.riskFlag());
    }

    @Test
    void evaluateSubstitution_whenAllowed_returnsAllowed() throws Exception {
        String mockResponse = """
                {
                  "model": "jev-latest",
                  "answers": {
                    "verdict": { "type": "choice", "choice": "ALLOWED", "confidence": 0.96 },
                    "same_group": { "type": "choice", "choice": "yes", "confidence": 0.99 }
                  }
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockResponse);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        var decision = jevService.evaluateSubstitution("Frango", "Peixe", "Emagrecimento");

        assertNotNull(decision);
        assertTrue(decision.success());
        assertEquals("ALLOWED", decision.verdict());
        assertTrue(decision.sameGroup());
    }

    @Test
    void evaluatePatientAdherence_whenWarning_returnsWarningStatus() throws Exception {
        String mockResponse = """
                {
                  "model": "jev-latest",
                  "answers": {
                    "status": { "type": "choice", "choice": "WARNING", "confidence": 0.88 },
                    "risk_score": { "type": "noul", "noul": 0.45 }
                  }
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockResponse);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        var decision = jevService.evaluatePatientAdherence("Evander", "Hipertrofia", "Enviou 2 refeicoes e relatou culpa");

        assertNotNull(decision);
        assertTrue(decision.success());
        assertEquals(com.compas.api.model.PatientStatus.WARNING, decision.suggestedStatus());
        assertEquals(0.45, decision.riskScore());
    }

    @Test
    void categorizeFood_whenProtein_returnsProteina() throws Exception {
        String mockResponse = """
                {
                  "model": "jev-latest",
                  "answers": {
                    "category": { "type": "choice", "choice": "PROTEINA", "confidence": 0.97 },
                    "unit": { "type": "choice", "choice": "GRAMAS", "confidence": 0.99 }
                  }
                }
                """;
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockResponse);
        org.mockito.Mockito.doReturn(httpResponse).when(httpClient).send(any(), any());

        var decision = jevService.categorizeFood("Whey Protein Isolado");

        assertNotNull(decision);
        assertTrue(decision.success());
        assertEquals("PROTEINA", decision.category());
        assertEquals("GRAMAS", decision.unit());
    }
}
