package com.nutriai.api.config;

import com.nutriai.api.service.AudioTranscriptionService;
import com.nutriai.api.service.EvolutionApiService;
import com.nutriai.api.service.JevService;
import com.nutriai.api.service.LlmService;
import com.nutriai.api.service.OllamaCloudLlmService;
import com.nutriai.api.service.TypeSafeJevService;
import com.nutriai.api.service.WhisperAudioTranscriptionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for LLM, Whisper audio transcription, and Evolution API services.
 * Provider swap requires only config changes (D-02).
 */
@Configuration
public class OllamaConfig {

    @Value("${nutriai.llm.base-url:https://api.ollama.com/v1}")
    private String llmBaseUrl;

    @Value("${nutriai.llm.model:glm4}")
    private String llmModel;

    @Value("${nutriai.llm.api-key:}")
    private String llmApiKey;

    @Value("${nutriai.llm.timeout-seconds:30}")
    private int llmTimeoutSeconds;

    @Value("${nutriai.whisper.base-url:https://api.openai.com/v1}")
    private String whisperBaseUrl;

    @Value("${nutriai.whisper.model:whisper-1}")
    private String whisperModel;

    @Value("${nutriai.whisper.api-key:}")
    private String whisperApiKey;

    @Value("${nutriai.whisper.language:pt}")
    private String whisperLanguage;

    @Value("${nutriai.whisper.enabled:true}")
    private boolean whisperEnabled;

    @Value("${nutriai.whisper.timeout-seconds:30}")
    private int whisperTimeoutSeconds;

    @Value("${nutriai.evolution.api-url:http://evolution-go:8080}")
    private String evolutionApiUrl;

    @Value("${nutriai.evolution.api-key:}")
    private String evolutionApiKey;

    @Value("${nutriai.evolution.instance-name:nutriai}")
    private String evolutionInstanceName;

    @Value("${nutriai.jev.api-url:https://api.typesafe.ai/v1/systemone}")
    private String jevApiUrl;

    @Value("${nutriai.jev.model:jev-latest}")
    private String jevModel;

    @Value("${nutriai.jev.api-key:}")
    private String jevApiKey;

    @Value("${nutriai.jev.enabled:true}")
    private boolean jevEnabled;

    @Value("${nutriai.jev.timeout-seconds:5}")
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


