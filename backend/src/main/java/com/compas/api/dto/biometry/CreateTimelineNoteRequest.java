package com.compas.api.dto.biometry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record CreateTimelineNoteRequest(
        @NotBlank(message = "Título da anotação é obrigatório")
        @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
        String title,

        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String description,

        LocalDateTime eventAt
) {}
