package com.compas.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @NotBlank(message = "Token de verificação é obrigatório")
        String token
) {}
