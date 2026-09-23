package com.compas.api.email;

/**
 * Service contract for sending transactional emails in Compas.
 */
public interface EmailService {

    /**
     * Sends an email verification link to a registered nutritionist.
     *
     * @param recipientEmail    the target email address
     * @param recipientName     the display name of the nutritionist
     * @param verificationToken the single-use verification token
     */
    void sendVerificationEmail(String recipientEmail, String recipientName, String verificationToken);
}
