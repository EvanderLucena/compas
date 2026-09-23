package com.compas.api.service;

import com.compas.api.dto.nutritionist.ChangePasswordRequest;
import com.compas.api.dto.nutritionist.NutritionistProfileResponse;
import com.compas.api.dto.nutritionist.UpdateProfileRequest;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.UserRole;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionistServiceTest {

    @Mock
    private NutritionistRepository nutritionistRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.compas.api.repository.RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private NutritionistService nutritionistService;

    private UUID nutritionistId;
    private Nutritionist nutritionist;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        nutritionist = Nutritionist.builder()
                .id(nutritionistId)
                .name("Dra. Roberta")
                .email("roberta@nutri.com")
                .passwordHash("hashed_old_password")
                .role(UserRole.NUTRITIONIST)
                .crn("12345")
                .crnRegional("CRN-3")
                .specialty("Esportiva")
                .whatsapp("11999998888")
                .onboardingCompleted(true)
                .subscriptionTier("TRIAL")
                .patientLimit(15)
                .trialEndsAt(LocalDateTime.now().plusDays(25))
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(5))
                .build();
    }

    @Test
    void getProfile_success() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId)).thenReturn(5L);

        NutritionistProfileResponse response = nutritionistService.getProfile(nutritionistId);

        assertNotNull(response);
        assertEquals(nutritionistId, response.id());
        assertEquals("Dra. Roberta", response.name());
        assertEquals("roberta@nutri.com", response.email());
        assertEquals("12345", response.crn());
        assertEquals("CRN-3", response.crnRegional());
        assertEquals("Esportiva", response.specialty());
        assertEquals("11999998888", response.whatsapp());
        assertEquals("TRIAL", response.subscriptionTier());
        assertEquals(15, response.patientLimit());
        assertEquals(5L, response.activePatientCount());
    }

    @Test
    void getProfile_notFound_throws404() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> nutritionistService.getProfile(nutritionistId)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void updateProfile_success() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(nutritionistRepository.save(any(Nutritionist.class))).thenAnswer(inv -> inv.getArgument(0));
        when(patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId)).thenReturn(8L);

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Dra. Roberta Novaes",
                "Nutri Roberta",
                "54321",
                "CRN-4",
                "Clínica Geral",
                "11988887777"
        );

        NutritionistProfileResponse response = nutritionistService.updateProfile(nutritionistId, request);

        assertEquals("Dra. Roberta Novaes", response.name());
        assertEquals("Nutri Roberta", response.professionalName());
        assertEquals("54321", response.crn());
        assertEquals("CRN-4", response.crnRegional());
        assertEquals("Clínica Geral", response.specialty());
        assertEquals("11988887777", response.whatsapp());
        assertEquals(8L, response.activePatientCount());
        verify(nutritionistRepository).save(nutritionist);
    }

    @Test
    void changePassword_success() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(passwordEncoder.matches("OldPassword123!", "hashed_old_password")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword456!")).thenReturn("hashed_new_password");

        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "NewPassword456!",
                "NewPassword456!"
        );

        nutritionistService.changePassword(nutritionistId, request);

        assertEquals("hashed_new_password", nutritionist.getPasswordHash());
        verify(nutritionistRepository).save(nutritionist);
        verify(refreshTokenRepository).deleteByNutritionistId(nutritionistId);
    }

    @Test
    void changePassword_wrongCurrentPassword_throws400() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(passwordEncoder.matches("WrongPass123!", "hashed_old_password")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest(
                "WrongPass123!",
                "NewPassword456!",
                "NewPassword456!"
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> nutritionistService.changePassword(nutritionistId, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("A senha atual está incorreta", ex.getReason());
    }

    @Test
    void changePassword_mismatchedConfirm_throws400() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(passwordEncoder.matches("OldPassword123!", "hashed_old_password")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "NewPassword456!",
                "DifferentPassword789!"
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> nutritionistService.changePassword(nutritionistId, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("A nova senha e a confirmação não conferem", ex.getReason());
    }

    @Test
    void changePassword_sameAsCurrent_throws400() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(passwordEncoder.matches("OldPassword123!", "hashed_old_password")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "OldPassword123!",
                "OldPassword123!"
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> nutritionistService.changePassword(nutritionistId, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("A nova senha deve ser diferente da senha atual", ex.getReason());
    }
}
