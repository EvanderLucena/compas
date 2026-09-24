package com.compas.api.dto.plantemplate;

import java.util.List;

public record PlanTemplateOptionDto(
        String name,
        Integer sortOrder,
        List<PlanTemplateItemDto> items
) {}
