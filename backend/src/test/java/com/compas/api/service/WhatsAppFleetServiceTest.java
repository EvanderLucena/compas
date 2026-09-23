package com.compas.api.service;

import com.compas.api.dto.whatsapp.fleet.CreateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.FleetSummaryDTO;
import com.compas.api.dto.whatsapp.fleet.InstanceQrCodeResponse;
import com.compas.api.dto.whatsapp.fleet.UpdateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.WhatsAppFleetInstanceDTO;
import com.compas.api.model.Patient;
import com.compas.api.model.WhatsAppInstance;
import com.compas.api.model.WhatsAppInstanceStatus;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppInstanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhatsAppFleetServiceTest {

    @Mock
    private WhatsAppInstanceRepository instanceRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EvolutionApiService evolutionApiService;

    @Mock
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Mock
    private com.compas.api.email.EmailService emailService;

    @InjectMocks
    private WhatsAppFleetService fleetService;

    private UUID instanceId1;
    private UUID instanceId2;
    private WhatsAppInstance instance1;
    private WhatsAppInstance instance2;

    @BeforeEach
    void setUp() {
        instanceId1 = UUID.randomUUID();
        instanceId2 = UUID.randomUUID();

        instance1 = WhatsAppInstance.builder()
                .id(instanceId1)
                .name("compas-chip-01")
                .phoneNumber("5511999990001")
                .description("Chip 01")
                .status(WhatsAppInstanceStatus.CONNECTED)
                .maxPatients(180)
                .active(true)
                .build();

        instance2 = WhatsAppInstance.builder()
                .id(instanceId2)
                .name("compas-chip-02")
                .phoneNumber("5511999990002")
                .description("Chip 02")
                .status(WhatsAppInstanceStatus.CONNECTED)
                .maxPatients(180)
                .active(true)
                .build();

        fleetService = new WhatsAppFleetService(
                instanceRepository,
                patientRepository,
                evolutionApiService,
                transactionManager,
                emailService,
                "admin@compas.app"
        );
    }

    @Test
    void listFleetInstances_returnsInstancesWithCalculatedMetrics() {
        when(instanceRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(instance1));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(90L);
        when(patientRepository.countDistinctNutritionistIdsByWhatsappInstanceId(instanceId1)).thenReturn(5L);

        List<WhatsAppFleetInstanceDTO> result = fleetService.listFleetInstances();

        assertEquals(1, result.size());
        WhatsAppFleetInstanceDTO dto = result.get(0);
        assertEquals("compas-chip-01", dto.name());
        assertEquals(90L, dto.patientCount());
        assertEquals(5L, dto.nutritionistCount());
        assertEquals(50, dto.capacityPercentage());
        assertFalse(dto.isNearCapacity());
    }

    @Test
    void getFleetSummary_aggregatesCorrectCountsAndAlerts() {
        when(instanceRepository.findAll()).thenReturn(List.of(instance1, instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(170L); // near capacity
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(40L);

        FleetSummaryDTO summary = fleetService.getFleetSummary();

        assertEquals(2, summary.totalInstances());
        assertEquals(2, summary.connectedInstances());
        assertEquals(0, summary.disconnectedInstances());
        assertEquals(210L, summary.totalAssignedPatients());
        assertEquals(360L, summary.totalCapacity());
        assertEquals(1, summary.alertCount()); // instance1 is >= 90%
    }

    @Test
    void createInstance_savesInstanceAndCallsEvolutionApi() {
        CreateWhatsAppInstanceRequest req = new CreateWhatsAppInstanceRequest(
                "compas-chip-03", "5511999990003", "Chip 03", 200);

        when(instanceRepository.findByName("compas-chip-03")).thenReturn(Optional.empty());
        when(instanceRepository.save(any(WhatsAppInstance.class))).thenAnswer(i -> {
            WhatsAppInstance inst = i.getArgument(0);
            inst.setId(UUID.randomUUID());
            return inst;
        });

        WhatsAppFleetInstanceDTO dto = fleetService.createInstance(req);

        assertNotNull(dto);
        assertEquals("compas-chip-03", dto.name());
        assertEquals(200, dto.maxPatients());
        verify(evolutionApiService).createInstance("compas-chip-03");
    }

    @Test
    void createInstance_duplicateName_throwsConflict() {
        CreateWhatsAppInstanceRequest req = new CreateWhatsAppInstanceRequest(
                "compas-chip-01", null, null, null);
        when(instanceRepository.findByName("compas-chip-01")).thenReturn(Optional.of(instance1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fleetService.createInstance(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void deleteInstance_gatewayFailure_throwsBadGateway() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.deleteInstance("compas-chip-01")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fleetService.deleteInstance(instanceId1));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getStatusCode());
    }

    @Test
    void migratePatients_targetInactive_throwsBadRequest() {
        instance2.setActive(false);
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.findById(instanceId2)).thenReturn(Optional.of(instance2));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fleetService.migratePatients(instanceId1, instanceId2));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void migratePatients_exceedsCapacity_throwsBadRequest() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.findById(instanceId2)).thenReturn(Optional.of(instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(170L);
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(20L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> fleetService.migratePatients(instanceId1, instanceId2));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void migratePatients_withNutritionistId_scopesMovingCount() {
        UUID nutriId = UUID.randomUUID();
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.findById(instanceId2)).thenReturn(Optional.of(instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(100L);
        when(patientRepository.countByWhatsappInstanceIdAndNutritionistIdAndActiveTrue(instanceId1, nutriId)).thenReturn(25L);
        when(patientRepository.reassignPatients(instanceId1, instanceId2, nutriId)).thenReturn(25);

        int count = fleetService.migratePatients(instanceId1, instanceId2, nutriId);

        assertEquals(25, count);
        verify(patientRepository).reassignPatients(instanceId1, instanceId2, nutriId);
    }


    @Test
    void connectInstance_returnsQrCodeWhenAvailable() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.fetchQrCode("compas-chip-01")).thenReturn(Optional.of("data:image/png;base64,mockqr"));

        InstanceQrCodeResponse response = fleetService.connectInstance(instanceId1);

        assertEquals("data:image/png;base64,mockqr", response.qrCodeBase64());
        assertEquals(WhatsAppInstanceStatus.CONNECTING, response.status());
        verify(instanceRepository).save(instance1);
    }

    @Test
    void syncInstanceStatus_updatesStatusToConnected() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.fetchConnectionState("compas-chip-01")).thenReturn(Optional.of("open"));

        WhatsAppFleetInstanceDTO dto = fleetService.syncInstanceStatus(instanceId1);

        assertEquals(WhatsAppInstanceStatus.CONNECTED, dto.status());
        verify(instanceRepository).save(instance1);
    }

    @Test
    void syncInstanceStatus_whenBanned_sendsAdminAlertEmail() {
        instance1.setStatus(WhatsAppInstanceStatus.CONNECTED);
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.fetchConnectionState("compas-chip-01")).thenReturn(Optional.of("banned"));
        when(instanceRepository.findByActiveTrueOrderByCreatedAtAsc()).thenReturn(List.of(instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(5L);
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(10L);
        when(patientRepository.reassignPatients(instanceId1, instanceId2, null)).thenReturn(5);

        WhatsAppFleetInstanceDTO dto = fleetService.syncInstanceStatus(instanceId1);

        assertEquals(WhatsAppInstanceStatus.BANNED, dto.status());
        verify(emailService).sendAdminAlertEmail(eq("admin@compas.app"), anyString(), anyString());
    }

    @Test
    void migratePatients_reassignsPatientsToTarget() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.findById(instanceId2)).thenReturn(Optional.of(instance2));
        when(patientRepository.reassignPatients(instanceId1, instanceId2, null)).thenReturn(42);

        int count = fleetService.migratePatients(instanceId1, instanceId2);

        assertEquals(42, count);
        verify(patientRepository).reassignPatients(instanceId1, instanceId2, null);
    }

    @Test
    void restartInstance_success_updatesStatus() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.restartInstance("compas-chip-01")).thenReturn(true);

        fleetService.restartInstance(instanceId1);

        assertEquals(WhatsAppInstanceStatus.CONNECTING, instance1.getStatus());
        verify(instanceRepository).save(instance1);
    }

    @Test
    void restartInstance_gatewayFailure_throwsBadGateway() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(evolutionApiService.restartInstance("compas-chip-01")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> fleetService.restartInstance(instanceId1));
    }


    @Test
    void assignPatientToInstance_stickyAffinityPreservesExistingInstance() {
        Patient patient = Patient.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .whatsappInstanceId(instanceId1)
                .build();

        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));

        Optional<WhatsAppInstance> assigned = fleetService.assignPatientToInstance(patient);

        assertTrue(assigned.isPresent());
        assertEquals(instanceId1, assigned.get().getId());
    }

    @Test
    void assignPatientToInstance_leastLoadedRoutingPicksLowestCount() {
        Patient patient = Patient.builder()
                .id(UUID.randomUUID())
                .name("Beatriz")
                .whatsappInstanceId(null)
                .build();

        when(instanceRepository.findByActiveTrueOrderByCreatedAtAsc()).thenReturn(List.of(instance1, instance2));
        // instance1 has 120 patients, instance2 has 20 patients
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(120L);
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(20L);

        Optional<WhatsAppInstance> assigned = fleetService.assignPatientToInstance(patient);

        assertTrue(assigned.isPresent());
        assertEquals(instanceId2, assigned.get().getId()); // picked instance2 because 20 < 120
        verify(patientRepository).save(patient);
    }

    @Test
    void autoFailover_whenInstanceBanned_migratesPatientsToHealthyInstance() {
        instance1.setStatus(WhatsAppInstanceStatus.BANNED);
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(15L);
        when(instanceRepository.findByActiveTrueOrderByCreatedAtAsc()).thenReturn(List.of(instance1, instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(5L);
        when(patientRepository.reassignPatients(instanceId1, instanceId2, null)).thenReturn(15);

        int moved = fleetService.autoFailover(instanceId1);

        assertEquals(15, moved);
        verify(patientRepository).reassignPatients(instanceId1, instanceId2, null);
    }

    @Test
    void autoFailover_whenNoPatients_returnsZero() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(0L);

        int moved = fleetService.autoFailover(instanceId1);

        assertEquals(0, moved);
    }

    @Test
    void updateInstance_whenStatusChangedToBanned_triggersAutoFailover() {
        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.save(any(WhatsAppInstance.class))).thenAnswer(inv -> inv.getArgument(0));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId1)).thenReturn(8L);
        when(instanceRepository.findByActiveTrueOrderByCreatedAtAsc()).thenReturn(List.of(instance1, instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(2L);
        when(patientRepository.reassignPatients(instanceId1, instanceId2, null)).thenReturn(8);

        UpdateWhatsAppInstanceRequest request = new UpdateWhatsAppInstanceRequest(
                null, null, null, null, WhatsAppInstanceStatus.BANNED
        );

        WhatsAppFleetInstanceDTO result = fleetService.updateInstance(instanceId1, request);

        assertEquals(WhatsAppInstanceStatus.BANNED, result.status());
        verify(patientRepository).reassignPatients(instanceId1, instanceId2, null);
        verify(emailService).sendAdminAlertEmail(eq("admin@compas.app"), anyString(), anyString());
    }

    @Test
    void assignPatientToInstance_whenCurrentInstanceBanned_reassignsToHealthyInstance() {
        instance1.setStatus(WhatsAppInstanceStatus.BANNED);
        Patient patient = Patient.builder()
                .id(UUID.randomUUID())
                .name("Mariana")
                .whatsappInstanceId(instanceId1)
                .build();

        when(instanceRepository.findById(instanceId1)).thenReturn(Optional.of(instance1));
        when(instanceRepository.findByActiveTrueOrderByCreatedAtAsc()).thenReturn(List.of(instance1, instance2));
        when(patientRepository.countByWhatsappInstanceIdAndActiveTrue(instanceId2)).thenReturn(3L);

        Optional<WhatsAppInstance> assigned = fleetService.assignPatientToInstance(patient);

        assertTrue(assigned.isPresent());
        assertEquals(instanceId2, assigned.get().getId());
        verify(patientRepository).save(patient);
    }
}
