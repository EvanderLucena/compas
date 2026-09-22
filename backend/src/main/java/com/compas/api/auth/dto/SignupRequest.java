package com.compas.api.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String name,

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(min = 8, max = 128, message = "Senha deve ter entre 8 e 128 caracteres")
        String password,

        @NotBlank(message = "CRN é obrigatório")
        @Size(max = 20, message = "CRN deve ter no máximo 20 caracteres")
        String crn,

        @NotBlank(message = "CRN regional é obrigatório")
        @Size(min = 2, max = 2, message = "CRN regional deve ter 2 caracteres")
        String crnRegional,

        @Size(max = 50, message = "Especialidade deve ter no máximo 50 caracteres")
        String specialty,

        @Size(max = 20, message = "WhatsApp deve ter no máximo 20 caracteres")
        String whatsapp,

        @AssertTrue(message = "Você deve aceitar os termos")
        boolean terms
) {}