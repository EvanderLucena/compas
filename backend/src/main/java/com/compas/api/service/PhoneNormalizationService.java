package com.compas.api.service;

import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Normalizes Brazilian phone numbers to DDD+number format.
 * Strips +55 prefix, spaces, dashes, parentheses.
 */
@Service
public class PhoneNormalizationService {

    private static final Pattern NON_DIGITS = Pattern.compile("\\D");
    // Brazilian mobile: 11 digits (2 DDD + 9 number). Landline: 10 digits (2 DDD + 8 number)
    private static final int MIN_LENGTH = 10;
    private static final int MAX_LENGTH = 11;

    /**
     * Normalize a Brazilian phone number.
     * @return normalized DDD+number, or empty if invalid
     */
    public Optional<String> normalize(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            return Optional.empty();
        }

        String digits = NON_DIGITS.matcher(rawPhone).replaceAll("");

        // Strip leading 55 if present as country code (12 or 13 digits: 55 + DDD + number).
        // If digits has <= 11 chars, a leading "55" is DDD 55 (RS), not country code.
        if (digits.startsWith("55") && digits.length() > MAX_LENGTH) {
            digits = digits.substring(2);
        }

        if (digits.length() < MIN_LENGTH || digits.length() > MAX_LENGTH) {
            return Optional.empty();
        }

        // Basic DDD validation: first two digits must be between 11 and 99
        int ddd;
        try {
            ddd = Integer.parseInt(digits.substring(0, 2));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        if (ddd < 11 || ddd > 99) {
            return Optional.empty();
        }

        return Optional.of(digits);
    }
}
