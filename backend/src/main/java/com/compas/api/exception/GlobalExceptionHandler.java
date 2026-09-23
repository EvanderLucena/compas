package com.compas.api.exception;

import com.compas.api.dto.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle ResourceNotFoundException — returns 404.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        ApiResponse<Void> response = ApiResponse.error(ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle SubscriptionRequiredException — returns 402 PAYMENT_REQUIRED with READ_ONLY_MODE code.
     */
    @ExceptionHandler(SubscriptionRequiredException.class)
    public ResponseEntity<Map<String, Object>> handleSubscriptionRequired(SubscriptionRequiredException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "READ_ONLY_MODE");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(body);
    }

    /**
     * Handle validation errors — returns 400 with field-level errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of(
                        "field", error.getField(),
                        "message", error.getDefaultMessage() != null ? error.getDefaultMessage() : "Valor inválido"
                ))
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Erro de validação");
        body.put("errors", errors);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Handle DataIntegrityViolationException — returns 409 for duplicate records.
     * Detects specific constraint for duplicate patient names.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        String message = ex.getMessage() != null && ex.getMessage().contains("uk_patient_name_nutri")
                ? "Você já tem um paciente com esse nome."
                : "Conflito de dados — registro duplicado";
        body.put("message", message);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Handle IllegalArgumentException — safety net for invalid enum values (400).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Valor inválido");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handle JSON/body parsing errors — returns 400 with root numeric message when available.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);

        String message = "Requisição inválida";
        Throwable cause = ex.getMostSpecificCause();
        if (cause != null && cause.getMessage() != null) {
            String causeMsg = cause.getMessage();
            if (causeMsg.contains("Valor numérico")) {
                message = "Valor numérico inválido. Use formato como 4.5 ou 4,5.";
            }
        }

        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handle AccessDeniedException from @PreAuthorize — returns 403.
     * Must be declared explicitly so the generic Exception handler doesn't swallow it as 500.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Acesso negado");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Handle ResponseStatusException — returns the respective status code.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", ex.getReason() != null ? ex.getReason() : "Erro na requisição");

        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    /**
     * Handle all other exceptions — returns 500 with generic message.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Erro interno do servidor");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
