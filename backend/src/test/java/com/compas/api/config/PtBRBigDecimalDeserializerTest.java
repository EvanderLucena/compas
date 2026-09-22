package com.compas.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PtBRBigDecimalDeserializerTest {

    private ObjectMapper mapper;
    private JacksonConfig.PtBRBigDecimalDeserializer deserializer;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        SimpleModule module = new JacksonConfig().ptBRBigDecimalModule();
        mapper.registerModule(module);
        deserializer = new JacksonConfig.PtBRBigDecimalDeserializer();
    }

    @Test
    @DisplayName("parses numeric JSON value as-is")
    void numericJsonValue() throws Exception {
        BigDecimal result = mapper.readValue("4.5", BigDecimal.class);
        assertEquals(new BigDecimal("4.5"), result);
    }

    @Test
    @DisplayName("parses pt-BR comma decimal from string: 4,5 → 4.5")
    void commaAsDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("4,5");
        assertEquals(new BigDecimal("4.5"), result);
    }

    @Test
    @DisplayName("parses international dot decimal from string: 4.5 → 4.5")
    void dotAsDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("4.5");
        assertEquals(new BigDecimal("4.5"), result);
    }

    @Test
    @DisplayName("parses pt-BR format: 1.234,5 → 1234.5")
    void ptBRThousandsWithDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("1.234,5");
        assertEquals(new BigDecimal("1234.5"), result);
    }

    @Test
    @DisplayName("parses international format: 1,234.5 → 1234.5")
    void internationalThousandsWithDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("1,234.5");
        assertEquals(new BigDecimal("1234.5"), result);
    }

    @Test
    @DisplayName("parses dot with 3 digits after as thousands: 1.840 → 1840")
    void dotAsThousandsSeparator() {
        BigDecimal result = deserializer.parsePtBRDecimal("1.840");
        assertEquals(new BigDecimal("1840"), result);
    }

    @Test
    @DisplayName("parses multiple dot thousands groups: 1.234.567 → 1234567")
    void multipleDotThousandsGroups() {
        BigDecimal result = deserializer.parsePtBRDecimal("1.234.567");
        assertEquals(new BigDecimal("1234567"), result);
    }

    @Test
    @DisplayName("keeps leading-zero dot decimal as decimal: 0.840 → 0.84")
    void zeroLeadingDotAsDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("0.840");
        assertEquals(new BigDecimal("0.84"), result);
    }

    @Test
    @DisplayName("parses comma with 3 digits after as decimal: 1,840 → 1.84")
    void commaWithThreeDigitsAsDecimal() {
        BigDecimal result = deserializer.parsePtBRDecimal("1,840");
        assertEquals(new BigDecimal("1.84"), result);
    }

    @Test
    @DisplayName("parses plain integer: 42 → 42")
    void plainInteger() {
        BigDecimal result = deserializer.parsePtBRDecimal("42");
        assertEquals(new BigDecimal("42"), result);
    }

    @Test
    @DisplayName("parses negative number: -4,5 → -4.5")
    void negativeNumber() {
        BigDecimal result = deserializer.parsePtBRDecimal("-4,5");
        assertEquals(new BigDecimal("-4.5"), result);
    }

    @Test
    @DisplayName("rejects ambiguous format: 1,2.3 — separators too close")
    void ambiguousFormat() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1,2.3");
        });
    }

    @Test
    @DisplayName("rejects double dots: 1..2")
    void doubleDots() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1..2");
        });
    }

    @Test
    @DisplayName("rejects adjacent different separators: 1,.2")
    void adjacentSeparatorsCommaDot() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1,.2");
        });
    }

    @Test
    @DisplayName("rejects adjacent different separators: 1.,2")
    void adjacentSeparatorsDotComma() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1.,2");
        });
    }

    @Test
    @DisplayName("rejects empty string")
    void emptyString() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("");
        });
    }

    @Test
    @DisplayName("rejects pure text input")
    void pureText() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("abc");
        });
    }

    @Test
    @DisplayName("rejects multiple commas without dot")
    void multipleCommasWithoutDot() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1,2,3");
        });
    }

    @Test
    @DisplayName("rejects malformed mixed separators with repeated decimal candidate")
    void malformedMixedRepeatedDecimalCandidate() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1,234.5,6");
        });
    }

    @Test
    @DisplayName("rejects misplaced minus sign")
    void misplacedMinusSign() {
        assertThrows(IllegalArgumentException.class, () -> {
            deserializer.parsePtBRDecimal("1-2");
        });
    }

    @Test
    @DisplayName("handles full JSON deserialization via ObjectMapper with string value")
    void objectMapperStringDeserialization() throws Exception {
        TestDto dto = mapper.readValue("{\"value\":\"4,5\"}", TestDto.class);
        assertEquals(new BigDecimal("4.5"), dto.value());
    }

    @Test
    @DisplayName("handles full JSON deserialization via ObjectMapper with numeric value")
    void objectMapperNumericDeserialization() throws Exception {
        TestDto dto = mapper.readValue("{\"value\":4.5}", TestDto.class);
        assertEquals(new BigDecimal("4.5"), dto.value());
    }

    @Test
    @DisplayName("handles integer field deserialization with pt-BR thousands string")
    void objectMapperIntegerThousandsDeserialization() throws Exception {
        IntDto dto = mapper.readValue("{\"value\":\"1.840\"}", IntDto.class);
        assertEquals(1840, dto.value());
    }

    @Test
    @DisplayName("rejects decimal string for integer field")
    void objectMapperIntegerRejectsDecimalString() {
        JsonMappingException exception = assertThrows(JsonMappingException.class, () -> {
            mapper.readValue("{\"value\":\"1,5\"}", IntDto.class);
        });
        assertTrue(exception.getCause() instanceof IllegalArgumentException);
    }

    record TestDto(BigDecimal value) {}
    record IntDto(Integer value) {}
}
