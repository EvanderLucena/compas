package com.compas.api.dto.plan;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for adding a new option to a meal slot.
 */
public record AddOptionRequest(
        @NotBlank(message = "name é obrigatório")
        String name
) {}