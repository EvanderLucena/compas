package com.compas.api.dto;

import java.util.Collections;
import java.util.List;

/**
 * Standardized API response wrapper for all endpoint responses.
 *
 * @param <T> the type of data in the response
 */
public record ApiResponse<T>(boolean success, T data, List<String> errors, String message) {

    /**
     * Create a success response with data.
     */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, Collections.emptyList(), null);
    }

    /**
     * Create an error response with a message.
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, Collections.emptyList(), message);
    }

    /**
     * Create a validation error response with field-level errors.
     */
    public static <T> ApiResponse<T> validationError(List<String> errors) {
        return new ApiResponse<>(false, null, errors, "Validation failed");
    }
}