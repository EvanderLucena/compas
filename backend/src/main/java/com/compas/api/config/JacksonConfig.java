package com.compas.api.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Configuration
public class JacksonConfig {

    @Bean
    public SimpleModule ptBRBigDecimalModule() {
        SimpleModule module = new SimpleModule();
        PtBRBigDecimalDeserializer bigDecimalDeserializer = new PtBRBigDecimalDeserializer();
        module.addDeserializer(BigDecimal.class, bigDecimalDeserializer);
        module.addDeserializer(Integer.class, new PtBRIntegerDeserializer(bigDecimalDeserializer));
        module.addDeserializer(Integer.TYPE, new PtBRIntegerDeserializer(bigDecimalDeserializer));
        return module;
    }

    static class PtBRBigDecimalDeserializer extends JsonDeserializer<BigDecimal> {

        @Override
        public BigDecimal deserialize(JsonParser p, DeserializationContext ctxt)
                throws IOException {
            JsonNode node = p.readValueAsTree();
            if (node.isNumber()) {
                return node.decimalValue();
            }
            if (node.isTextual()) {
                return parsePtBRDecimal(node.asText().trim());
            }
            throw new IllegalArgumentException(
                "Valor numérico inválido. Use formato como 4.5 ou 4,5.");
        }

        BigDecimal parsePtBRDecimal(String raw) {
            validateNotEmpty(raw);
            boolean negative = raw.startsWith("-");
            String working = negative ? raw.substring(1) : raw;
            validateAllowedCharacters(working, raw);
            validateCleanInput(working, raw);
            String normalized = normalize(working, raw);
            return toBigDecimal(normalized, negative, raw);
        }

        private void validateNotEmpty(String raw) {
            if (raw.isEmpty()) {
                throw new IllegalArgumentException(
                    "Valor numérico vazio. Informe um número como 4.5 ou 4,5.");
            }
        }

        private void validateCleanInput(String working, String raw) {
            if (working.isEmpty()) {
                throw invalidFormat(raw);
            }
            if (working.contains("..") || working.contains(",,")) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores duplicados não são permitidos.");
            }
            if (working.contains(",.") || working.contains(".,")) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores adjacentes não são permitidos.");
            }
        }

        private void validateAllowedCharacters(String working, String raw) {
            if (!working.matches("[0-9.,]+")) {
                throw invalidFormat(raw);
            }
        }

        private String normalize(String working, String raw) {
            int firstComma = working.indexOf(',');
            int firstDot = working.indexOf('.');
            int lastComma = working.lastIndexOf(',');
            int lastDot = working.lastIndexOf('.');

            if (firstComma == -1 && firstDot == -1) {
                return working;
            }
            if (firstComma != -1 && firstDot != -1) {
                return normalizeMixed(working, raw, firstComma, firstDot,
                        lastComma, lastDot);
            }
            if (firstComma != -1) {
                return normalizeCommaOnly(working, firstComma, lastComma, raw);
            }
            return normalizeDotOnly(working, firstDot, lastDot, raw);
        }

        private String normalizeMixed(String w, String raw,
                int fc, int fd, int lc, int ld) {
            long dotCount = w.chars().filter(c -> c == '.').count();
            long commaCount = w.chars().filter(c -> c == ',').count();
            if (dotCount > 1 && commaCount > 0) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw + "'. Formato ambíguo.");
            }
            if (dotCount == 1 && commaCount == 1
                    && Math.abs(fd - fc) <= 2) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Separadores muito próximos — formato ambíguo.");
            }
            if (lc > ld) {
                if (w.substring(0, lc).contains(",")) {
                    throw new IllegalArgumentException(
                        "Valor numérico inválido: '" + raw + "'. Formato ambíguo.");
                }
                return w.substring(0, lc).replace(".", "")
                    + "." + w.substring(lc + 1);
            }
            if (w.substring(0, ld).contains(".")) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw + "'. Formato ambíguo.");
            }
            return w.substring(0, ld).replace(",", "")
                + "." + w.substring(ld + 1);
        }

        private String normalizeCommaOnly(String w,
                int firstComma, int lastComma, String raw) {
            if (lastComma != firstComma) {
                throw new IllegalArgumentException(
                    "Valor numérico inválido: '" + raw
                    + "'. Múltiplas vírgulas sem ponto geram formato ambíguo.");
            }
            return w.substring(0, firstComma)
                + "." + w.substring(firstComma + 1);
        }

        private String normalizeDotOnly(String w,
                int firstDot, int lastDot, String raw) {
            long dotCount = w.chars().filter(c -> c == '.').count();
            if (dotCount > 1) {
                return normalizeThousandDot(w, raw);
            }
            String before = w.substring(0, firstDot);
            String after = w.substring(firstDot + 1);
            if (after.length() == 3 && !before.isEmpty()
                    && !"0".equals(before)
                    && before.chars().allMatch(Character::isDigit)) {
                return before + after;
            }
            return before + "." + after;
        }

        private String normalizeThousandDot(String w, String raw) {
            String[] chunks = w.split("\\.");
            for (String chunk : chunks) {
                if (chunk.isEmpty()) {
                    throw new IllegalArgumentException(
                        "Valor numérico inválido: '" + raw
                        + "'. Separadores de milhar mal posicionados.");
                }
            }
            boolean firstGrouped = chunks[0].length() >= 1
                    && chunks[0].length() <= 3;
            boolean middleGrouped3 = true;
            for (int i = 1; i < chunks.length - 1; i++) {
                if (chunks[i].length() != 3) {
                    middleGrouped3 = false;
                    break;
                }
            }
            String lastChunk = chunks[chunks.length - 1];
            if (firstGrouped && middleGrouped3 && lastChunk.length() == 3) {
                return w.replace(".", "");
            }
            throw new IllegalArgumentException(
                "Valor numérico inválido: '" + raw
                + "'. Separadores de milhar mal posicionados.");
        }

        private BigDecimal toBigDecimal(String normalized,
                boolean negative, String raw) {
            String sign = negative ? "-" : "";
            try {
                BigDecimal result = new BigDecimal(sign + normalized);
                result = result.setScale(10, RoundingMode.HALF_UP);
                if (result.scale() > 0) {
                    result = result.stripTrailingZeros();
                }
                if (result.scale() < 0) {
                    result = result.setScale(0, RoundingMode.UNNECESSARY);
                }
                return result;
            } catch (NumberFormatException e) {
                throw invalidFormat(raw);
            }
        }

        private IllegalArgumentException invalidFormat(String raw) {
            return new IllegalArgumentException(
                "Valor numérico inválido: '" + raw
                + "'. Use formato como 4.5 ou 4,5.");
        }
    }

    static class PtBRIntegerDeserializer extends JsonDeserializer<Integer> {

        private final PtBRBigDecimalDeserializer decimalDeserializer;

        PtBRIntegerDeserializer(PtBRBigDecimalDeserializer decimalDeserializer) {
            this.decimalDeserializer = decimalDeserializer;
        }

        @Override
        public Integer deserialize(JsonParser p, DeserializationContext ctxt)
                throws IOException {
            JsonNode node = p.readValueAsTree();
            if (node.isInt()) {
                return node.intValue();
            }
            if (node.isNumber()) {
                BigDecimal value = node.decimalValue();
                if (value.stripTrailingZeros().scale() > 0) {
                    throw new IllegalArgumentException(
                        "Valor numérico inválido. Este campo aceita apenas números inteiros.");
                }
                return value.intValueExact();
            }
            if (node.isTextual()) {
                BigDecimal value = decimalDeserializer.parsePtBRDecimal(node.asText().trim());
                if (value.stripTrailingZeros().scale() > 0) {
                    throw new IllegalArgumentException(
                        "Valor numérico inválido. Este campo aceita apenas números inteiros.");
                }
                return value.intValueExact();
            }
            throw new IllegalArgumentException(
                "Valor numérico inválido. Este campo aceita apenas números inteiros.");
        }
    }
}
