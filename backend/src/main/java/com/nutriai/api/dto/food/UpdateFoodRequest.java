package com.nutriai.api.dto.food;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateFoodRequest(
        @Size(min = 1, max = 150, message = "Nome deve ter entre 1 e 150 caracteres")
        String name,

        String category,

        String unit,

        @DecimalMin(value = "0.01", message = "Quantidade de referência deve ser maior que zero")
        BigDecimal referenceAmount,

        @DecimalMin(value = "0.0", message = "Kcal não pode ser negativo")
        @DecimalMax(value = "10000.0", message = "Kcal não pode exceder 10000")
        BigDecimal kcal,

        @DecimalMin(value = "0.0", message = "Proteína não pode ser negativa")
        @DecimalMax(value = "1000.0", message = "Proteína não pode exceder 1000g")
        BigDecimal prot,

        @DecimalMin(value = "0.0", message = "Carboidrato não pode ser negativo")
        @DecimalMax(value = "1000.0", message = "Carboidrato não pode exceder 1000g")
        BigDecimal carb,

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