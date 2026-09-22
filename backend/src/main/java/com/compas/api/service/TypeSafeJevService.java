package com.compas.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.compas.api.dto.jev.JevAdherenceDecision;
import com.compas.api.dto.jev.JevDecision;
import com.compas.api.dto.jev.JevFoodCategorizationDecision;
import com.compas.api.dto.jev.JevMealSanityDecision;
import com.compas.api.dto.jev.JevSubstitutionDecision;
import com.compas.api.model.PatientStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

public class TypeSafeJevService implements JevService {

    private static final Logger LOG = LoggerFactory.getLogger(TypeSafeJevService.class);

    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final boolean enabled;
    private final int timeoutSeconds;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TypeSafeJevService(
            String apiUrl,
            String apiKey,
            String model,
            boolean enabled,
            int timeoutSeconds
    ) {
        this(apiUrl, apiKey, model, enabled, timeoutSeconds, null);
    }

    TypeSafeJevService(
            String apiUrl,
            String apiKey,
            String model,
            boolean enabled,
            int timeoutSeconds,
            HttpClient httpClient
    ) {
        this.apiUrl = apiUrl != null && !apiUrl.isBlank()
                ? apiUrl
                : "https://api.typesafe.ai/v1/systemone";
        this.apiKey = apiKey;
        this.model = model != null && !model.isBlank() ? model : "jev-latest";
        this.enabled = enabled;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 5;
        this.httpClient = httpClient != null
                ? httpClient
                : HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    @Override
    public JevDecision analyzePatientMessage(String messageText) {
        if (!isAvailable() || messageText == null || messageText.isBlank()) {
            return JevDecision.fallback();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("state", messageText.trim());
            root.put("model", model);

            ObjectNode questions = root.putObject("questions");

            ObjectNode intentNode = questions.putObject("intent");
            intentNode.put("type", "choice");
            intentNode.put("instructions", "Qual e a intencao da mensagem do paciente?");
            ObjectNode intentCriteria = intentNode.putObject("criteria");
            intentCriteria.put("meal_log", "Relato de refeicao, alimentos ou bebidas consumidos");
            intentCriteria.put("doubt", "Duvida sobre o plano alimentar ou alimentos");
            intentCriteria.put("emergency", "Sintomas clinicos agudos ou dor");
            intentCriteria.put("greeting", "Cumprimento, agradecimento ou conversa casual");
            intentCriteria.put("other", "Outro assunto");

            ObjectNode sentimentNode = questions.putObject("sentiment");
            sentimentNode.put("type", "choice");
            sentimentNode.put("instructions", "Qual e o estado emocional em relacao a dieta?");
            ObjectNode sentimentCriteria = sentimentNode.putObject("criteria");
            sentimentCriteria.put("confident", "Animado, focado, satisfeito e no controle");
            sentimentCriteria.put("neutral", "Neutro ou puramente informativo");
            sentimentCriteria.put("struggling", "Com culpa, estresse, frustracao ou desanimado");

            ObjectNode attentionNode = questions.putObject("requires_human_attention");
            attentionNode.put("type", "noul");
            attentionNode.put("instructions", "O nutricionista deve prestar suporte acolhedor a essa mensagem?");

            Optional<JsonNode> responseOpt = executeRequest(root.toString());
            if (responseOpt.isEmpty()) {
                return JevDecision.fallback();
            }

            JsonNode responseRoot = responseOpt.get();
            String responseModel = responseRoot.path("model").asText(model);
            JsonNode answers = responseRoot.path("answers");

            JsonNode intentResp = answers.path("intent");
            String intent = intentResp.path("choice").asText("other");
            double intentConfidence = intentResp.path("confidence").asDouble(0.0);

            JsonNode sentimentResp = answers.path("sentiment");
            String sentiment = sentimentResp.path("choice").asText("neutral");
            double sentimentConfidence = sentimentResp.path("confidence").asDouble(0.0);

            JsonNode attentionResp = answers.path("requires_human_attention");
            double attentionScore = attentionResp.path("noul").asDouble(0.0);
            boolean isEmergency = "emergency".equalsIgnoreCase(intent);
            if (isEmergency) {
                attentionScore = Math.max(attentionScore, 1.0);
            }
            boolean requiresAttention = attentionScore >= 0.70 || isEmergency;

            return new JevDecision(
                    intent,
                    intentConfidence,
                    sentiment,
                    sentimentConfidence,
                    attentionScore,
                    requiresAttention,
                    true,
                    responseModel
            );
        } catch (Exception ex) {
            LOG.warn("Error in analyzePatientMessage: {}", ex.getMessage());
            return JevDecision.fallback();
        }
    }

    @Override
    public JevMealSanityDecision validateMealSanity(
            String userText,
            String mealLabel,
            double totalKcal,
            double totalGrams,
            List<String> itemNames
    ) {
        if (!isAvailable()) {
            return JevMealSanityDecision.plausibleDefault();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            String itemsSummary = itemNames != null && !itemNames.isEmpty()
                    ? String.join(", ", itemNames)
                    : "itens nao especificados";
            String state = String.format(
                    "Refeicao: %s. Relato: %s. Itens: %s. Calorias: %.1f kcal. Peso: %.1f g.",
                    mealLabel != null ? mealLabel : "Geral",
                    userText != null ? userText : "",
                    itemsSummary,
                    totalKcal,
                    totalGrams);
            root.put("state", state);
            root.put("model", model);

            ObjectNode questions = root.putObject("questions");

            ObjectNode plausibleNode = questions.putObject("is_plausible");
            plausibleNode.put("type", "choice");
            plausibleNode.put("instructions",
                    "As quantidades e calorias estimadas sao plausiveis para consumo de um ser humano em uma refeicao?");
            ObjectNode pCrit = plausibleNode.putObject("criteria");
            pCrit.put("yes", "Sim, perfeitamente realista e fisiologicamente plausivel");
            pCrit.put("no", "Nao, valor absurdo, alucinacao de calculo ou quantidade impossivel");

            ObjectNode flagNode = questions.putObject("risk_flag");
            flagNode.put("type", "choice");
            flagNode.put("instructions", "Qual e a classificacao de consistencia da porcao?");
            ObjectNode fCrit = flagNode.putObject("criteria");
            fCrit.put("NORMAL", "Refeicao e macros compativeis com porcao habitual");
            fCrit.put("EXTREME_PORTION", "Porcao descrita anormalmente volumosa ou irreal");
            fCrit.put("UNREALISTIC_CALORIES", "Calorias extremamente desproporcionais aos alimentos");

            Optional<JsonNode> responseOpt = executeRequest(root.toString());
            if (responseOpt.isEmpty()) {
                return JevMealSanityDecision.fallback();
            }

            JsonNode answers = responseOpt.get().path("answers");
            JsonNode pResp = answers.path("is_plausible");
            boolean plausible = !"no".equalsIgnoreCase(pResp.path("choice").asText("yes"));
            double confidence = pResp.path("confidence").asDouble(0.9);

            JsonNode fResp = answers.path("risk_flag");
            String flag = fResp.path("choice").asText(plausible ? "NORMAL" : "EXTREME_PORTION");

            String obs = plausible
                    ? "Refeição dentro dos padrões esperados"
                    : "Valores atípicos detectados pela triagem";
            return new JevMealSanityDecision(plausible, confidence, flag, obs, true);
        } catch (Exception ex) {
            LOG.warn("Error in validateMealSanity: {}", ex.getMessage());
            return JevMealSanityDecision.fallback();
        }
    }

    @Override
    public JevSubstitutionDecision evaluateSubstitution(
            String prescribedFood,
            String desiredFood,
            String patientObjective
    ) {
        if (!isAvailable() || prescribedFood == null || desiredFood == null) {
            return JevSubstitutionDecision.fallback();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            String state = String.format("Objetivo: %s. Alimento no plano: %s. Substituto desejado: %s.",
                    patientObjective != null ? patientObjective : "Saude e bem-estar",
                    prescribedFood.trim(),
                    desiredFood.trim());
            root.put("state", state);
            root.put("model", model);

            ObjectNode questions = root.putObject("questions");

            ObjectNode verdictNode = questions.putObject("verdict");
            verdictNode.put("type", "choice");
            verdictNode.put("instructions", "Qual o veredito nutricional da substituicao proposta?");
            ObjectNode vCrit = verdictNode.putObject("criteria");
            vCrit.put("ALLOWED", "Substituicao saudavel, compativel e recomendada");
            vCrit.put("PORTION_ADJUSTMENT", "Substituicao aceitavel, mas requer atencao a porcao por ser mais calorica");
            vCrit.put("NOT_RECOMMENDED", "Substituicao desfavoravel nutricionalmente para o objetivo");

            ObjectNode sameGroupNode = questions.putObject("same_group");
            sameGroupNode.put("type", "choice");
            sameGroupNode.put("instructions", "Os dois alimentos pertencem ao mesmo grupo alimentar funcional?");
            ObjectNode sCrit = sameGroupNode.putObject("criteria");
            sCrit.put("yes", "Sim, mesmo grupo alimentar principal (ex: proteina por proteina)");
            sCrit.put("no", "Nao, pertencem a grupos alimentares diferentes");

            Optional<JsonNode> responseOpt = executeRequest(root.toString());
            if (responseOpt.isEmpty()) {
                return JevSubstitutionDecision.fallback();
            }

            JsonNode answers = responseOpt.get().path("answers");
            String verdict = answers.path("verdict").path("choice").asText("ALLOWED");
            double confidence = answers.path("verdict").path("confidence").asDouble(0.85);
            boolean sameGroup = "yes".equalsIgnoreCase(answers.path("same_group").path("choice").asText("yes"));

            String rationale = switch (verdict) {
                case "NOT_RECOMMENDED" ->
                    "Substituição com perfil nutricional desfavorável em relação ao plano original.";
                case "PORTION_ADJUSTMENT" ->
                    "Substituição válida, com atenção à porção para manter o equilíbrio calórico.";
                default ->
                    "Substituição equilibrada e compatível com o grupo alimentar prescrito.";
            };

            return new JevSubstitutionDecision(verdict, confidence, sameGroup, rationale, true);
        } catch (Exception ex) {
            LOG.warn("Error in evaluateSubstitution: {}", ex.getMessage());
            return JevSubstitutionDecision.fallback();
        }
    }

    @Override
    public JevAdherenceDecision evaluatePatientAdherence(String patientName, String objective, String recentSummary) {
        if (!isAvailable() || recentSummary == null || recentSummary.isBlank()) {
            return JevAdherenceDecision.fallback();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            String state = String.format("Paciente: %s. Objetivo: %s. Historico recente: %s.",
                    patientName != null ? patientName : "Paciente",
                    objective != null ? objective : "Acompanhamento",
                    recentSummary.trim());
            root.put("state", state);
            root.put("model", model);

            ObjectNode questions = root.putObject("questions");

            ObjectNode statusNode = questions.putObject("status");
            statusNode.put("type", "choice");
            statusNode.put("instructions", "Qual o nivel de adesao e risco de abandono deste paciente?");
            ObjectNode stCrit = statusNode.putObject("criteria");
            stCrit.put("ONTRACK", "No caminho: consistente, enviando refeicoes e engajado");
            stCrit.put("WARNING", "Atencao: desmotivacao, quebra de rotina ou culpa frequente");
            stCrit.put("DANGER", "Critico: alto risco de evasao, parou de registrar ou frustracao aguda");

            ObjectNode riskNode = questions.putObject("risk_score");
            riskNode.put("type", "noul");
            riskNode.put("instructions", "Probabilidade estimada de abandono ou desengajamento da dieta");

            Optional<JsonNode> responseOpt = executeRequest(root.toString());
            if (responseOpt.isEmpty()) {
                return JevAdherenceDecision.fallback();
            }

            JsonNode answers = responseOpt.get().path("answers");
            String statusChoice = answers.path("status").path("choice").asText("ONTRACK");
            double confidence = answers.path("status").path("confidence").asDouble(0.8);
            double riskScore = answers.path("risk_score").path("noul").asDouble(0.15);

            PatientStatus status = switch (statusChoice.toUpperCase()) {
                case "DANGER" -> PatientStatus.DANGER;
                case "WARNING" -> PatientStatus.WARNING;
                default -> PatientStatus.ONTRACK;
            };

            String insight = switch (status) {
                case DANGER -> "Risco elevado de desengajamento. Recomendado contato próximo e acolhimento.";
                case WARNING -> "Oscilação no ritmo de registros ou relatos de dificuldade. Encoraje o paciente.";
                case ONTRACK -> "Excelente consistência de registros e adesão equilibrada ao plano.";
            };

            return new JevAdherenceDecision(status, riskScore, confidence, insight, true);
        } catch (Exception ex) {
            LOG.warn("Error in evaluatePatientAdherence: {}", ex.getMessage());
            return JevAdherenceDecision.fallback();
        }
    }

    @Override
    public JevFoodCategorizationDecision categorizeFood(String foodName) {
        if (!isAvailable() || foodName == null || foodName.isBlank()) {
            return JevFoodCategorizationDecision.fallback();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("state", "Alimento: " + foodName.trim());
            root.put("model", model);

            ObjectNode questions = root.putObject("questions");

            ObjectNode catNode = questions.putObject("category");
            catNode.put("type", "choice");
            catNode.put("instructions", "Qual a categoria principal deste alimento?");
            ObjectNode cCrit = catNode.putObject("criteria");
            cCrit.put("PROTEINA", "Carnes, ovos, peixes, whey protein, queijos, frango, tofu");
            cCrit.put("CARBOIDRATO", "Arroz, pao, batata, aveia, massas, tapioca, mandioca");
            cCrit.put("GORDURA", "Azeite, manteiga, castanhas, pasta de amendoim, abacate");
            cCrit.put("VEGETAL", "Legumes, verduras, saladas, folhas, brocolis, tomate");
            cCrit.put("FRUTA", "Frutas frescas ou polpas (banana, maca, laranja, morango)");
            cCrit.put("BEBIDA", "Agua, cha, cafe, suco, bebida vegetal");
            cCrit.put("OUTRO", "Molhos, temperos, doces ou outros");

            ObjectNode unitNode = questions.putObject("unit");
            unitNode.put("type", "choice");
            unitNode.put("instructions", "Qual a unidade mais usual de consumo?");
            ObjectNode uCrit = unitNode.putObject("criteria");
            uCrit.put("GRAMAS", "Alimento solido medido em gramas");
            uCrit.put("ML", "Bebida ou liquido medido em mililitros");
            uCrit.put("UNIDADE", "Alimento consumido por unidade inteira");

            Optional<JsonNode> responseOpt = executeRequest(root.toString());
            if (responseOpt.isEmpty()) {
                return JevFoodCategorizationDecision.fallback();
            }

            JsonNode answers = responseOpt.get().path("answers");
            String cat = answers.path("category").path("choice").asText("OUTRO");
            double confidence = answers.path("category").path("confidence").asDouble(0.9);
            String unit = answers.path("unit").path("choice").asText("GRAMAS");
            Double refAmount = "UNIDADE".equalsIgnoreCase(unit) ? 1.0 : ("ML".equalsIgnoreCase(unit) ? 200.0 : 100.0);

            return new JevFoodCategorizationDecision(cat, unit, refAmount, confidence, true);
        } catch (Exception ex) {
            LOG.warn("Error in categorizeFood: {}", ex.getMessage());
            return JevFoodCategorizationDecision.fallback();
        }
    }

    private Optional<JsonNode> executeRequest(String payload) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() != 200) {
                LOG.warn("Jev API returned HTTP status {}", response.statusCode());
                return Optional.empty();
            }

            return Optional.of(objectMapper.readTree(response.body()));
        } catch (Exception ex) {
            LOG.warn("Error calling Jev API: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
