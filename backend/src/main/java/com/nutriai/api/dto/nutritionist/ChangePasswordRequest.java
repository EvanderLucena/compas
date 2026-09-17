package com.nutriai.api.dto.nutritionist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "A senha atual é obrigatória")
        String currentPassword,

        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = 8, max = 128, message = "A nova senha deve ter entre 8 e 128 caracteres")
        String newPassword,

        @NotBlank(message = "A confirmação da nova senha é obrigatória")
        String confirmPassword
) {}
