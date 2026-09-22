package com.compas.api.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EvolutionApiServiceTest {

    @Test
    void formatTargetPhone_with11Digits_prepends55() {
        // Standard SP mobile without country code
        assertEquals("5511999988776", EvolutionApiService.formatTargetPhone("11999988776"));

        // Formatted with dashes, spaces, parens
        assertEquals("5511999988776", EvolutionApiService.formatTargetPhone("(11) 99998-8776"));
    }

    @Test
    void formatTargetPhone_withDDD55Mobile_prepends55Correctly() {
        // Rio Grande do Sul DDD 55 (11 digits: 55 + 999998888)
        assertEquals("5555999998888", EvolutionApiService.formatTargetPhone("55999998888"));
    }

    @Test
    void formatTargetPhone_withDDD55Landline_prepends55Correctly() {
        // Rio Grande do Sul DDD 55 landline (10 digits: 55 + 33445566)
        assertEquals("555533445566", EvolutionApiService.formatTargetPhone("5533445566"));
    }

    @Test
    void formatTargetPhone_alreadyHasCountryCode55_doesNotDuplicate() {
        // Full international SP mobile (13 digits: 55 11 999988776)
        assertEquals("5511999988776", EvolutionApiService.formatTargetPhone("+5511999988776"));

        // Full international RS mobile (13 digits: 55 55 999998888)
        assertEquals("5555999998888", EvolutionApiService.formatTargetPhone("+5555999998888"));
    }

    @Test
    void formatTargetPhone_nullOrEmpty_returnsEmpty() {
        assertEquals("", EvolutionApiService.formatTargetPhone(null));
        assertEquals("", EvolutionApiService.formatTargetPhone(""));
    }
}
