package com.compas.api.controller;

import com.compas.api.dto.ApiResponse;
import com.compas.api.dto.whatsapp.fleet.CreateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.FleetSummaryDTO;
import com.compas.api.dto.whatsapp.fleet.InstancePatientDTO;
import com.compas.api.dto.whatsapp.fleet.InstanceQrCodeResponse;
import com.compas.api.dto.whatsapp.fleet.MigratePatientsRequest;
import com.compas.api.dto.whatsapp.fleet.UpdateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.WhatsAppFleetInstanceDTO;
import com.compas.api.service.WhatsAppFleetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/whatsapp")
@PreAuthorize("hasRole('ADMIN')")
public class WhatsAppFleetAdminController {

    private final WhatsAppFleetService fleetService;

    public WhatsAppFleetAdminController(WhatsAppFleetService fleetService) {
        this.fleetService = fleetService;
    }

    @GetMapping("/instances")
    public ResponseEntity<ApiResponse<List<WhatsAppFleetInstanceDTO>>> listInstances() {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.listFleetInstances()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FleetSummaryDTO>> getSummary() {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.getFleetSummary()));
    }

    @PostMapping("/instances")
    public ResponseEntity<ApiResponse<WhatsAppFleetInstanceDTO>> createInstance(
            @Valid @RequestBody CreateWhatsAppInstanceRequest request) {
        WhatsAppFleetInstanceDTO created = fleetService.createInstance(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping("/instances/{id}")
    public ResponseEntity<ApiResponse<WhatsAppFleetInstanceDTO>> getInstance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.getInstance(id)));
    }

    @PutMapping("/instances/{id}")
    public ResponseEntity<ApiResponse<WhatsAppFleetInstanceDTO>> updateInstance(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWhatsAppInstanceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.updateInstance(id, request)));
    }

    @DeleteMapping("/instances/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteInstance(@PathVariable UUID id) {
        fleetService.deleteInstance(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Instância removida com sucesso")));
    }

    @PostMapping("/instances/{id}/connect")
    public ResponseEntity<ApiResponse<InstanceQrCodeResponse>> connectInstance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.connectInstance(id)));
    }

    @PostMapping("/instances/{id}/sync")
    public ResponseEntity<ApiResponse<WhatsAppFleetInstanceDTO>> syncStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.syncInstanceStatus(id)));
    }

    @PostMapping("/instances/{id}/restart")
    public ResponseEntity<ApiResponse<Map<String, String>>> restartInstance(@PathVariable UUID id) {
        fleetService.restartInstance(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Comando de reinício enviado à instância")));
    }

    @PostMapping("/instances/{id}/disconnect")
    public ResponseEntity<ApiResponse<Map<String, String>>> disconnectInstance(@PathVariable UUID id) {
        fleetService.disconnectInstance(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Instância desconectada com sucesso")));
    }

    @PostMapping("/instances/{id}/migrate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> migratePatients(
            @PathVariable UUID id,
            @Valid @RequestBody MigratePatientsRequest request) {
        int count = fleetService.migratePatients(id, request.targetInstanceId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "message", count + " pacientes migrados com sucesso",
                "migratedCount", count
        )));
    }

    @GetMapping("/instances/{id}/patients")
    public ResponseEntity<ApiResponse<Page<InstancePatientDTO>>> listInstancePatients(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(fleetService.listInstancePatients(id, pageable)));
    }
}
