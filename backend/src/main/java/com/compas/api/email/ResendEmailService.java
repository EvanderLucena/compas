package com.compas.api.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Resend-backed transactional email delivery service with local development fallback.
 */
@Service
public class ResendEmailService implements EmailService {

    private static final Logger LOG = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(10);

    private final String apiKey;
    private final String fromAddress;
    private final String verificationBaseUrl;
    private final boolean enabled;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public ResendEmailService(
            @Value("${compas.email.resend-api-key:${RESEND_API_KEY:}}") String apiKey,
            @Value("${compas.email.from:${COMPAS_EMAIL_FROM:Compas <nao-responder@compas.app>}}") String fromAddress,
            @Value("${compas.email.verification-base-url:${COMPAS_FRONTEND_URL:http://localhost:5173}}")
            String verificationBaseUrl,
            @Value("${compas.email.enabled:true}") boolean enabled,
            ObjectMapper objectMapper
    ) {
        this(apiKey, fromAddress, verificationBaseUrl, enabled, objectMapper,
                HttpClient.newBuilder().connectTimeout(DEFAULT_TIMEOUT).build());
    }

    public ResendEmailService(
            String apiKey,
            String fromAddress,
            String verificationBaseUrl,
            boolean enabled,
            ObjectMapper objectMapper,
            HttpClient httpClient
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.fromAddress = fromAddress != null && !fromAddress.isBlank()
                ? fromAddress.trim()
                : "Compas <nao-responder@compas.app>";
        this.verificationBaseUrl = verificationBaseUrl != null && !verificationBaseUrl.isBlank()
                ? verificationBaseUrl.replaceAll("/+$", "")
                : "http://localhost:5173";
        this.enabled = enabled;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public void sendVerificationEmail(String recipientEmail, String recipientName, String verificationToken) {
        String verificationUrl = verificationBaseUrl + "/verify-email?token=" + verificationToken;

        if (shouldSimulateEmail()) {
            LOG.info("[Email Simulation] Verificação simulada para {}", recipientEmail);
            LOG.debug("[Email Simulation] Token de verificação para {}: {}", recipientEmail, verificationToken);
            return;
        }

        try {
            String htmlContent = buildVerificationHtml(recipientName, verificationUrl);
            Map<String, Object> payload = Map.of(
                    "from", fromAddress,
                    "to", List.of(recipientEmail),
                    "subject", "Confirme seu e-mail no Compas 🧭",
                    "html", htmlContent
            );

            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(DEFAULT_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                LOG.info("Email de verificação enviado com sucesso para {} via Resend", recipientEmail);
            } else {
                LOG.error("Falha ao enviar e-mail via Resend para {}. Status: {}, Resposta: {}",
                        recipientEmail, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            LOG.error("Erro inesperado ao disparar e-mail de verificação para {}: {}",
                    recipientEmail, e.getMessage(), e);
        }
    }

    private boolean shouldSimulateEmail() {
        return !enabled || apiKey.isBlank() || apiKey.startsWith("test") || apiKey.contains("dummy");
    }

    private String buildVerificationHtml(String recipientName, String verificationUrl) {
        String nameSafe = (recipientName != null && !recipientName.isBlank())
                ? recipientName.trim()
                : "Nutricionista";

        return """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu e-mail — Compas</title>
        </head>
        <body style="margin: 0; padding: 24px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 560px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; margin: 0 auto;">
            <tr>
              <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
                <div style="font-size: 24px; font-weight: 700; color: #10b981; letter-spacing: -0.5px;">
                  Compas 🧭
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
                  Plataforma Clínica Inteligente
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="font-size: 20px; font-weight: 600; color: #f8fafc; margin: 0 0 16px;">
                  Olá, %s!
                </h1>
                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px;">
                  Obrigado por se cadastrar no Compas. Para confirmar a autenticidade do seu endereço de e-mail e garantir o acesso seguro ao seu painel clínico, clique no botão abaixo:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="%s" style="background-color: #10b981; color: #022c22; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                    Confirmar meu e-mail
                  </a>
                </div>
                <p style="font-size: 13px; line-height: 1.5; color: #94a3b8; margin: 24px 0 0;">
                  Se o botão não funcionar, copie e cole o link a seguir no seu navegador:<br>
                  <a href="%s" style="color: #38bdf8; word-break: break-all; font-size: 12px;">%s</a>
                </p>
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Este link expira em <strong>24 horas</strong>.<br>
                  Se você não criou uma conta no Compas, nenhuma ação é necessária e você pode desconsiderar esta mensagem com segurança.
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(nameSafe, verificationUrl, verificationUrl, verificationUrl);
    }
}
