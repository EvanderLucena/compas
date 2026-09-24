package com.compas.api.dto.plantemplate;

import java.util.List;

public record PlanTemplateStructureDto(
        List<PlanTemplateMealDto> meals,
        List<PlanTemplateExtraDto> extras
) {}
