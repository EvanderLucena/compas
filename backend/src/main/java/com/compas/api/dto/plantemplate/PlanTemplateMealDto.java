package com.compas.api.dto.plantemplate;

import java.util.List;

public record PlanTemplateMealDto(
        String label,
        String time,
        Integer sortOrder,
        List<PlanTemplateOptionDto> options
) {}
