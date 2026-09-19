package com.nutriai.api.dto.food;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateFoodRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String name,

        String category,

        @NotBlank(message = "Unidade é obrigatória")
        String unit,

        @NotNull(message = "Quantidade de referência é obrigatória")
        @DecimalMin(value = "0.01", message = "Quantidade de referência deve ser maior que zero")
        BigDecimal referenceAmount,

        @NotNull(message = "Kcal é obrigatório")
        @DecimalMin(value = "0.0", message = "Kcal não pode ser negativo")
        @DecimalMax(value = "10000.0", message = "Kcal não pode exceder 10000")
        BigDecimal kcal,

        @NotNull(message = "Proteína é obrigatória")
        @DecimalMin(value = "0.0", message = "Proteína não pode ser negativa")
        @DecimalMax(value = "1000.0", message = "Proteína não pode exceder 1000g")
        BigDecimal prot,

        @NotNull(message = "Carboidrato é obrigatório")
        @DecimalMin(value = "0.0", message = "Carboidrato não pode ser negativo")
        @DecimalMax(value = "1000.0", message = "Carboidrato não pode exceder 1000g")
        BigDecimal carb,

        @NotNull(message = "Gordura é obrigatória")
        @DecimalMin(value = "0.0", message = "Gordura não pode ser negativa")
        @DecimalMax(value = "1000.0", message = "Gordura não pode exceder 1000g")
        BigDecimal fat,

        @DecimalMin(value = "0.0", message = "Fibra não pode ser negativa")
        @DecimalMax(value = "1000.0", message = "Fibra não pode exceder 1000g")
        BigDecimal fiber,

        @Size(max = 100, message = "Modo de preparo deve ter no máximo 100 caracteres")
        String prep,

        @Size(max = 100, message = "Porção caseira deve ter no máximo 100 caracteres")
        String portionLabel
) {}