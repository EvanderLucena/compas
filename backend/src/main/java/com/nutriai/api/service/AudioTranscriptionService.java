package com.nutriai.api.service;

import java.util.Optional;

/**
 * Interface for transcribing audio messages into text.
 */
public interface AudioTranscriptionService {

    /**
     * Transcribe an audio payload into text.
     *
     * @param audioBytes the binary content of the audio file
     * @param filename   the audio filename with extension (e.g., audio.ogg, audio.mp3)
     * @return Optional containing the transcribed text, or empty if transcription failed
     */
    Optional<String> transcribe(byte[] audioBytes, String filename);

    /**
     * Check if the transcription service is configured and available.
     *
     * @return true if available, false otherwise
     */
    boolean isAvailable();
}
