package com.compas.api.exception;

/**
 * Thrown when a nutritionist with an inactive or expired subscription attempts a mutation action.
 * Maps to HTTP 402 PAYMENT_REQUIRED with code READ_ONLY_MODE.
 */
public class SubscriptionRequiredException extends RuntimeException {

    public SubscriptionRequiredException(String message) {
        super(message);
    }
}
