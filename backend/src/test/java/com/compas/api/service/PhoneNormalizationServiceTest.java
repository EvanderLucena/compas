package com.compas.api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PhoneNormalizationServiceTest {

    private final PhoneNormalizationService service = new PhoneNormalizationService();

    @Test
    void normalize_fullInternationalFormat_strips55AndPlus() {
        Optional<String> result = service.normalize("+5511999988776");
        assertEquals(Optional.of("11999988776"), result);
    }

    @Test
    void normalize_overlongInternationalFormat_returnsEmpty() {
        Optional<String> result = service.normalize("+55119999887766");
        assertTrue(result.isEmpty());
    }

    @Test
    void normalize_withSpacesStrips_cleanNumber() {
        Optional<String> result = service.normalize("11 9 9988-7766");
        assertEquals(Optional.of("11999887766"), result);
    }

    @Test
    void normalize_alreadyNormalized_noChange() {
        Optional<String> result = service.normalize("11999887766");
        assertEquals(Optional.of("11999887766"), result);
    }

    @Test
    void normalize_landlineFormat_returns8Digits() {
        Optional<String> result = service.normalize("1133445566");
        assertEquals(Optional.of("1133445566"), result);
    }

    @Test
    void normalize_invalidShort_returnsEmpty() {
        Optional<String> result = service.normalize("123");
        assertTrue(result.isEmpty());
    }

    @Test
    void normalize_withDDDAndLandline_keeps10Digits() {
        Optional<String> result = service.normalize("551133445566");
        assertEquals(Optional.of("1133445566"), result);
    }

    @Test
    void normalize_ddd55WithoutCountryCode_preservesDDD55() {
        // Rio Grande do Sul DDD 55: 11 digits (mobile)
        Optional<String> result = service.normalize("55999887766");
        assertEquals(Optional.of("55999887766"), result);

        // DDD 55 landline: 10 digits
        Optional<String> landline = service.normalize("5533445566");
        assertEquals(Optional.of("5533445566"), landline);
    }

    @Test
    void normalize_ddd55WithCountryCode_stripsCountryCodeAndPreservesDDD55() {
        // +55 55 99988-7766 (13 digits with country code)
        Optional<String> result = service.normalize("+5555999887766");
        assertEquals(Optional.of("55999887766"), result);

        // +55 55 3344-5566 (12 digits with country code)
        Optional<String> landline = service.normalize("+555533445566");
        assertEquals(Optional.of("5533445566"), landline);
    }
}
