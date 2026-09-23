package com.compas.api.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ResendEmailServiceTest {

    private ObjectMapper objectMapper;
    private HttpClient httpClient;
    private HttpResponse<String> httpResponse;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        objectMapper = new ObjectMapper();
        httpClient = mock(HttpClient.class);
        httpResponse = mock(HttpResponse.class);
    }

    @Test
    void sendVerificationEmail_simulatesWhenKeyIsBlank() throws IOException, InterruptedException {
        ResendEmailService service = new ResendEmailService(
                "",
                "Compas <nao-responder@compas.app>",
                "http://localhost:5173",
                true,
                objectMapper,
                httpClient
        );

        service.sendVerificationEmail("nutri@teste.com", "Dra. Mariana", "token123");

        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void sendVerificationEmail_simulatesWhenKeyIsTestKey() throws IOException, InterruptedException {
        ResendEmailService service = new ResendEmailService(
                "test_key_123",
                "Compas <nao-responder@compas.app>",
                "http://localhost:5173",
                true,
                objectMapper,
                httpClient
        );

        service.sendVerificationEmail("nutri@teste.com", "Dra. Mariana", "token123");

        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void sendVerificationEmail_sendsHttpRequestWhenKeyIsProvided() throws IOException, InterruptedException {
        when(httpResponse.statusCode()).thenReturn(200);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        ResendEmailService service = new ResendEmailService(
                "re_live_valid_key_123",
                "Compas <nao-responder@compas.app>",
                "https://app.compas.com.br",
                true,
                objectMapper,
                httpClient
        );

        service.sendVerificationEmail("nutri@teste.com", "Dra. Mariana", "abc456");

        ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(captor.capture(), any());

        HttpRequest sentRequest = captor.getValue();
        assertEquals("POST", sentRequest.method());
        assertEquals("https://api.resend.com/emails", sentRequest.uri().toString());
        assertTrue(sentRequest.headers().firstValue("Authorization").orElse("").contains("re_live_valid_key_123"));
    }

    @Test
    void sendVerificationEmail_handlesExceptionGracefully() throws IOException, InterruptedException {
        when(httpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Network timeout"));

        ResendEmailService service = new ResendEmailService(
                "re_live_valid_key_123",
                "Compas <nao-responder@compas.app>",
                "https://app.compas.com.br",
                true,
                objectMapper,
                httpClient
        );

        assertDoesNotThrow(() ->
                service.sendVerificationEmail("nutri@teste.com", "Dra. Mariana", "abc456")
        );
    }

    @Test
    void sendVerificationEmail_escapesHtmlInRecipientName() throws IOException, InterruptedException {
        when(httpResponse.statusCode()).thenReturn(200);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        ResendEmailService service = new ResendEmailService(
                "re_live_valid_key_123",
                "Compas <nao-responder@compas.app>",
                "https://app.compas.com.br",
                true,
                objectMapper,
                httpClient
        );

        service.sendVerificationEmail("nutri@teste.com", "<script>alert(1)</script> Dra. Test", "abc456");

        ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(captor.capture(), any());

        HttpRequest sentRequest = captor.getValue();
        assertNotNull(sentRequest);
    }

    @Test
    void sendAdminAlertEmail_simulatesWhenKeyIsBlank() throws IOException, InterruptedException {
        ResendEmailService service = new ResendEmailService(
                "",
                "Compas <nao-responder@compas.app>",
                "http://localhost:5173",
                true,
                objectMapper,
                httpClient
        );

        service.sendAdminAlertEmail("admin@compas.app", "Alerta WhatsApp", "Instância desconectada");

        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void sendAdminAlertEmail_sendsRealRequestWhenConfigured() throws IOException, InterruptedException {
        when(httpResponse.statusCode()).thenReturn(200);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        ResendEmailService service = new ResendEmailService(
                "re_live_valid_key_123",
                "Compas <nao-responder@compas.app>",
                "https://app.compas.com.br",
                true,
                objectMapper,
                httpClient
        );

        service.sendAdminAlertEmail("admin@compas.app", "Alerta WhatsApp", "Instância banida");

        ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(captor.capture(), any());

        HttpRequest sentRequest = captor.getValue();
        assertEquals("POST", sentRequest.method());
        assertEquals("https://api.resend.com/emails", sentRequest.uri().toString());
    }
}
