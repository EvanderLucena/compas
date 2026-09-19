package com.nutriai.api.dto.plan;

import jakarta.validation.constraints.NotBlank;

public record EvaluateSubstitutionRequest(
        @NotBlank(message = "Alimento prescrito e obrigatorio")
        String prescribedFood,

        @NotBlank(message = "Alimento substituto desejado e obrigatorio")
        String desiredFood
) {}
