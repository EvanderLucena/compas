package com.compas.api.config;

import com.compas.api.service.AudioTranscriptionService;
import com.compas.api.service.EvolutionApiService;
import com.compas.api.service.JevService;
import com.compas.api.service.LlmService;
import com.compas.api.service.OllamaCloudLlmService;
import com.compas.api.service.TypeSafeJevService;
import com.compas.api.service.WhisperAudioTranscriptionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for LLM, Whisper audio transcription, and Evolution API services.
 * Provider swap requires only config changes (D-02).
 */
@Configuration
public class OllamaConfig {

    @Value("${compas.llm.base-url:${nutriai.llm.base-url:https://api.ollama.com/v1}}")
    private String llmBaseUrl;

    @Value("${compas.llm.model:${nutriai.llm.model:glm4}}")
    private String llmModel;

    @Value("${compas.llm.api-key:${nutriai.llm.api-key:}}")
    private String llmApiKey;

    @Value("${compas.llm.timeout-seconds:${nutriai.llm.timeout-seconds:30}}")
    private int llmTimeoutSeconds;

    @Value("${compas.whisper.base-url:${nutriai.whisper.base-url:https://api.openai.com/v1}}")
    private String whisperBaseUrl;

    @Value("${compas.whisper.model:${nutriai.whisper.model:whisper-1}}")
    private String whisperModel;

    @Value("${compas.whisper.api-key:${nutriai.whisper.api-key:}}")
    private String whisperApiKey;

    @Value("${compas.whisper.language:${nutriai.whisper.language:pt}}")
    private String whisperLanguage;

    @Value("${compas.whisper.enabled:${nutriai.whisper.enabled:true}}")
    private boolean whisperEnabled;

    @Value("${compas.whisper.timeout-seconds:${nutriai.whisper.timeout-seconds:30}}")
    private int whisperTimeoutSeconds;

    @Value("${compas.evolution.api-url:${nutriai.evolution.api-url:http://evolution-go:8080}}")
    private String evolutionApiUrl;

    @Value("${compas.evolution.api-key:${nutriai.evolution.api-key:}}")
    private String evolutionApiKey;

    @Value("${compas.evolution.instance-name:${nutriai.evolution.instance-name:compas}}")
    private String evolutionInstanceName;

    @Value("${compas.jev.api-url:${nutriai.jev.api-url:https://api.typesafe.ai/v1/systemone}}")
    private String jevApiUrl;

    @Value("${compas.jev.model:${nutriai.jev.model:jev-latest}}")
    private String jevModel;

    @Value("${compas.jev.api-key:${nutriai.jev.api-key:}}")
    private String jevApiKey;

    @Value("${compas.jev.enabled:${nutriai.jev.enabled:true}}")
    private boolean jevEnabled;

    @Value("${compas.jev.timeout-seconds:${nutriai.jev.timeout-seconds:5}}")
    private int jevTimeoutSeconds;

    @Bean
    LlmService ollamaCloudLlmService() {
        return new OllamaCloudLlmService(llmBaseUrl, llmModel, llmApiKey, llmTimeoutSeconds);
    }

    @Bean
    AudioTranscriptionService audioTranscriptionService() {
        return new WhisperAudioTranscriptionService(
                whisperBaseUrl,
                whisperModel,
                whisperApiKey,
                whisperLanguage,
                whisperEnabled,
                whisperTimeoutSeconds
        );
    }

    @Bean
    EvolutionApiService evolutionApiService() {
        return new EvolutionApiService(evolutionApiUrl, evolutionApiKey, evolutionInstanceName);
    }

    @Bean
    JevService jevService() {
        return new TypeSafeJevService(
                jevApiUrl,
                jevApiKey,
                jevModel,
                jevEnabled,
                jevTimeoutSeconds
        );
    }
}


