package com.compas.api.dto.whatsapp.fleet;

public record FleetSummaryDTO(
        int totalInstances,
        int connectedInstances,
        int disconnectedInstances,
        long totalAssignedPatients,
        long totalCapacity,
        int alertCount
) {
}
