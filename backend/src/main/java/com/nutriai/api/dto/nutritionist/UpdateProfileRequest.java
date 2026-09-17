package com.nutriai.api.dto.nutritionist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String name,

        @Size(max = 20, message = "O CRN deve ter no máximo 20 caracteres")
        String crn,

        @Size(max = 10, message = "A região do CRN deve ter no máximo 10 caracteres")
        String crnRegional,

        @Size(max = 100, message = "A especialidade deve ter no máximo 100 caracteres")
        String specialty,

        @Size(max = 20, message = "O WhatsApp deve ter no máximo 20 caracteres")
        String whatsapp
) {}
