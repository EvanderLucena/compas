package com.compas.api.dto.plantemplate;

import com.compas.api.model.PlanTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PlanTemplateResponse(
        UUID id,
        UUID nutritionistId,
        String name,
        String description,
        String category,
        Boolean isSystem,
        BigDecimal kcalTarget,
        BigDecimal protTarget,
        BigDecimal carbTarget,
        BigDecimal fatTarget,
        List<PlanTemplateMealDto> meals,
        List<PlanTemplateExtraDto> extras,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PlanTemplateResponse from(PlanTemplate template, PlanTemplateStructureDto structure) {
        return new PlanTemplateResponse(
                template.getId(),
                template.getNutritionistId(),
                template.getName(),
                template.getDescription(),
                template.getCategory(),
                template.getIsSystem(),
                template.getKcalTarget(),
                template.getProtTarget(),
                template.getCarbTarget(),
                template.getFatTarget(),
                structure != null && structure.meals() != null ? structure.meals() : List.of(),
                structure != null && structure.extras() != null ? structure.extras() : List.of(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
