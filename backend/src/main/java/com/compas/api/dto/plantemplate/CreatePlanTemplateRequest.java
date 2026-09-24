package com.compas.api.dto.plantemplate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreatePlanTemplateRequest(
        @NotBlank(message = "O nome do modelo é obrigatório")
        @Size(max = 200, message = "O nome do modelo deve ter no máximo 200 caracteres")
        String name,

        @Size(max = 2000, message = "A descrição deve ter no máximo 2000 caracteres")
        String description,

        @Size(max = 50, message = "A categoria deve ter no máximo 50 caracteres")
        String category,

        @NotNull(message = "A meta calórica é obrigatória")
        @Positive(message = "A meta calórica deve ser positiva")
        BigDecimal kcalTarget,

        BigDecimal protTarget,
        BigDecimal carbTarget,
        BigDecimal fatTarget,

        List<PlanTemplateMealDto> meals,
        List<PlanTemplateExtraDto> extras
) {}
